// Optional testnet wallet layer. Everything here is read-only or a plain
// connection request — nothing ever asks for a seed phrase, private key or
// password, nothing auto-sends a transaction, and nothing is stored beyond
// session memory (see rules below). The base game works fully without this.
//
// IMPORTANT — fill in before using the testnet features for real:
// chainId/rpcUrl/explorerUrl below are deliberately left as placeholders.
// Guessing a real chain's values here would be worse than leaving them
// blank, since a wrong chainId silently points players at the wrong
// network. Put the project's actual testnet details here once you have
// them; until then CONNECT TESTNET will show "not configured" instead of
// pretending to work.
export const TESTNET_CONFIG = {
  chainId: 'REPLACE_WITH_ACTUAL_CHAIN_ID', // e.g. '0x...' hex chain id
  chainName: 'TARGET TESTNET',
  rpcUrl: 'REPLACE_WITH_RPC_URL',
  explorerUrl: 'REPLACE_WITH_EXPLORER_URL',
};

function isConfigured() {
  return (
    !TESTNET_CONFIG.chainId.startsWith('REPLACE_') &&
    !TESTNET_CONFIG.rpcUrl.startsWith('REPLACE_')
  );
}

// Which on-chain fact unlocks which reward. WALLET_CONNECTED is fully
// implemented (it only needs a connected wallet, nothing chain-specific).
// The others need contract/token addresses that aren't supplied yet — see
// checkEligibility() below; they report "not configured" rather than
// faking a result.
export const UNLOCK_RULES = [
  { id: 'testnet_runner', type: 'WALLET_CONNECTED', reward: 'testnet_runner' },
  { id: 'spark_agent', type: 'TESTNET_TRANSACTION', reward: 'spark_agent' },
  { id: 'vibe_builder', type: 'TOKEN_BALANCE', reward: 'vibe_builder' },
];

export class WalletManager {
  constructor() {
    this.address = null;
    this.connected = false;
    this.correctNetwork = false;
    this.lastError = null;
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
      // No real chain configured yet — can't claim any network is "correct".
      this.correctNetwork = false;
      return false;
    }
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      this.correctNetwork = chainId === TESTNET_CONFIG.chainId;
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

  // Read-only eligibility check for one UNLOCK_RULES entry. Never fabricates
  // a positive result — a rule whose data source isn't configured yet
  // reports NOT_CONFIGURED rather than silently unlocking.
  async checkEligibility(rule) {
    if (!this.connected) return { eligible: false, reason: 'WALLET_NOT_CONNECTED' };

    switch (rule.type) {
      case 'WALLET_CONNECTED':
        return { eligible: true };

      case 'TESTNET_BALANCE':
      case 'NFT_OWNERSHIP':
      case 'TOKEN_BALANCE':
      case 'TESTNET_TRANSACTION':
      case 'CONTRACT_INTERACTION':
        // These need a real RPC + contract/token address, which aren't
        // supplied in TESTNET_CONFIG yet. Report honestly instead of
        // hard-coding a fake pass.
        return { eligible: false, reason: 'NOT_CONFIGURED' };

      default:
        return { eligible: false, reason: 'UNKNOWN_RULE' };
    }
  }
}

export { isConfigured };
