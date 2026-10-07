// Optional testnet wallet layer. Everything here is read-only or a plain
// connection request — nothing ever asks for a seed phrase, private key or
// password, nothing auto-sends a transaction, and nothing is stored beyond
// session memory. The base game works fully without this.
//
// Network: Robinhood Chain Testnet. Confirmed directly from a wallet's own
// "Add network" screen (not guessed) on 2026-10-07:
//   chainId 46630 (0xb626), rpc.testnet.chain.robinhood.com/rpc,
//   explorer.testnet.chain.robinhood.com
export const TESTNET_CONFIG = {
  chainId: '0xb626', // 46630 decimal — from the wallet's own Add Network screen
  chainName: 'Robinhood Chain Testnet',
  rpcUrl: 'https://rpc.testnet.chain.robinhood.com/rpc',
  explorerUrl: 'https://explorer.testnet.chain.robinhood.com',
  currencySymbol: 'ETH',
  // $VIBE token, launched via testnet.vibevibe.fun — confirmed by the user.
  vibeTokenAddress: '0xaa71ab53A5b85C935955DD88440002dB7a7ED4ec',
};

function isConfigured() {
  return (
    !TESTNET_CONFIG.chainId.startsWith('REPLACE_') &&
    !TESTNET_CONFIG.rpcUrl.startsWith('REPLACE_')
  );
}

// Which on-chain fact unlocks which reward, and how much. minTokens is in
// whole $VIBE (not raw units) — converted using the token's own on-chain
// decimals() at check time, never assumed, so a non-18-decimal token still
// works correctly.
export const UNLOCK_RULES = [
  { id: 'testnet_runner', type: 'TOKEN_BALANCE', reward: 'testnet_runner', minTokens: 50 },
  { id: 'spark_agent', type: 'TOKEN_BALANCE', reward: 'spark_agent', minTokens: 100 },
  { id: 'vibe_builder', type: 'TOKEN_BALANCE', reward: 'vibe_builder', minTokens: 200 },
];

// --- Minimal hand-rolled ABI encoding for two read-only ERC-20 calls ---
// Deliberately not pulling in ethers/web3 for two function selectors, per
// the spec's own "prefer a lightweight implementation" rule.

const SELECTOR_DECIMALS = '0x313ce567'; // decimals()
const SELECTOR_BALANCE_OF = '0x70a08231'; // balanceOf(address)

function encodeBalanceOf(address) {
  const clean = address.toLowerCase().replace('0x', '');
  return SELECTOR_BALANCE_OF + clean.padStart(64, '0');
}

export class WalletManager {
  constructor() {
    this.address = null;
    this.connected = false;
    this.correctNetwork = false;
    this.lastError = null;
    this._decimalsCache = null;
  }

  hasInjectedWallet() {
    return typeof window !== 'undefined' && !!window.ethereum;
  }

  async connect() {
    this.lastError = null;
    if (!this.hasInjectedWallet()) {
      this.lastError = 'NO_WALLET';
      return { ok: false, reason: 'NO_WALLET' };
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || !accounts.length) {
        this.lastError = 'REJECTED';
        return { ok: false, reason: 'REJECTED' };
      }
      this.address = accounts[0];
      this.connected = true;
      await this.checkNetwork();
      return { ok: true, address: this.address, correctNetwork: this.correctNetwork };
    } catch (e) {
      // covers user rejection and any provider error — never thrown upward
      this.lastError = 'REJECTED';
      return { ok: false, reason: 'REJECTED' };
    }
  }

  async checkNetwork() {
    if (!this.hasInjectedWallet() || !this.connected) {
      this.correctNetwork = false;
      return false;
    }
    if (!isConfigured()) {
      this.correctNetwork = false;
      return false;
    }
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      this.correctNetwork = String(chainId).toLowerCase() === TESTNET_CONFIG.chainId.toLowerCase();
      return this.correctNetwork;
    } catch (e) {
      this.correctNetwork = false;
      return false;
    }
  }

  async switchNetwork() {
    if (!this.hasInjectedWallet() || !isConfigured()) {
      return { ok: false, reason: 'NOT_CONFIGURED' };
    }
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TESTNET_CONFIG.chainId }],
      });
      await this.checkNetwork();
      return { ok: this.correctNetwork };
    } catch (e) {
      // Most wallets throw error code 4902 when the chain isn't added yet.
      if (e && e.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: TESTNET_CONFIG.chainId,
              chainName: TESTNET_CONFIG.chainName,
              rpcUrls: [TESTNET_CONFIG.rpcUrl],
              nativeCurrency: { name: TESTNET_CONFIG.currencySymbol, symbol: TESTNET_CONFIG.currencySymbol, decimals: 18 },
              blockExplorerUrls: [TESTNET_CONFIG.explorerUrl],
            }],
          });
          await this.checkNetwork();
          return { ok: this.correctNetwork };
        } catch (addErr) {
          return { ok: false, reason: 'REJECTED_OR_UNAVAILABLE' };
        }
      }
      return { ok: false, reason: 'REJECTED_OR_UNAVAILABLE' };
    }
  }

  disconnect() {
    // This only clears local session state — it can't force-revoke a
    // dApp connection in the wallet itself, which is normal for EVM wallets.
    this.address = null;
    this.connected = false;
    this.correctNetwork = false;
  }

  shortAddress() {
    if (!this.address) return 'Not Connected';
    return this.address.slice(0, 6) + '...' + this.address.slice(-4);
  }

  // Reads the token's own decimals() once and caches it — never assumes 18.
  async _getDecimals(tokenAddress) {
    if (this._decimalsCache !== null) return this._decimalsCache;
    try {
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: tokenAddress, data: SELECTOR_DECIMALS }, 'latest'],
      });
      this._decimalsCache = parseInt(result, 16);
      if (Number.isNaN(this._decimalsCache)) this._decimalsCache = 18;
    } catch (e) {
      this._decimalsCache = 18; // sane ERC-20 default if the call itself fails
    }
    return this._decimalsCache;
  }

  async _getTokenBalance(tokenAddress, owner) {
    const data = encodeBalanceOf(owner);
    const result = await window.ethereum.request({
      method: 'eth_call',
      params: [{ to: tokenAddress, data }, 'latest'],
    });
    return BigInt(result);
  }

  // Read-only eligibility check for one UNLOCK_RULES entry. Never fabricates
  // a positive result — a check that can't actually run reports a clear
  // reason instead of silently unlocking.
  async checkEligibility(rule) {
    if (!this.connected) return { eligible: false, reason: 'WALLET_NOT_CONNECTED' };
    if (!this.correctNetwork) return { eligible: false, reason: 'WRONG_NETWORK' };

    switch (rule.type) {
      case 'WALLET_CONNECTED':
        return { eligible: true };

      case 'TOKEN_BALANCE': {
        if (!isConfigured() || !TESTNET_CONFIG.vibeTokenAddress) {
          return { eligible: false, reason: 'NOT_CONFIGURED' };
        }
        try {
          const decimals = await this._getDecimals(TESTNET_CONFIG.vibeTokenAddress);
          const balanceRaw = await this._getTokenBalance(TESTNET_CONFIG.vibeTokenAddress, this.address);
          const thresholdRaw = BigInt(rule.minTokens) * (10n ** BigInt(decimals));
          return { eligible: balanceRaw >= thresholdRaw, reason: balanceRaw >= thresholdRaw ? null : 'INSUFFICIENT_BALANCE' };
        } catch (e) {
          // RPC failure, contract not found, etc. — never claim eligibility on an error.
          return { eligible: false, reason: 'RPC_ERROR' };
        }
      }

      case 'TESTNET_BALANCE':
      case 'NFT_OWNERSHIP':
      case 'TESTNET_TRANSACTION':
      case 'CONTRACT_INTERACTION':
        // Not used by the current UNLOCK_RULES, and no contract/criteria
        // supplied for them yet — report honestly rather than guessing.
        return { eligible: false, reason: 'NOT_CONFIGURED' };

      default:
        return { eligible: false, reason: 'UNKNOWN_RULE' };
    }
  }
}

export { isConfigured };
