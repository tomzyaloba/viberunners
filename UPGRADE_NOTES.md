# VIBE RUNNER — Community + Web3 Upgrade

This replaces your existing 6 root files with upgraded versions and adds
5 new JS modules. Structure stays flat (no `/src` folder), exactly as your
repo already has it, and `index.html` still loads `game.js` from the root.

## Files in this zip

Replace these at the root of `Viberun-game`:
- `index.html` (new screens added: character select, testnet menu, mute button, richer HUD)
- `style.css` (styles for the above)
- `game.js` (now wires coins/VIBE PACK/audio/characters/wallet together)
- `player.js` (adds flight mode + character stat multipliers)
- `ui.js` (rewritten for the new screens)

Add these new files at the root (same level as `game.js`):
- `storage.js` — local progression (best score, VIBE totals, unlocks, achievements, sound pref). Never stores wallet secrets.
- `characters.js` — the 4-character roster and unlock rules.
- `audio.js` — music/SFX manager. Missing audio files never crash the game; they're silently skipped.
- `coins.js` — VIBE Coins: spawn formations, combos, collection.
- `vibepack.js` — the rare VIBE PACK flying power-up pickup.
- `web3.js` — optional testnet wallet connection + eligibility checks.

`obstacles.js` is unchanged — no need to replace it, but no harm if you do (it's identical).

## Before the testnet feature is "live"

Open `web3.js` and fill in `TESTNET_CONFIG`:

```js
export const TESTNET_CONFIG = {
  chainId: 'REPLACE_WITH_ACTUAL_CHAIN_ID',
  chainName: 'TARGET TESTNET',
  rpcUrl: 'REPLACE_WITH_RPC_URL',
  explorerUrl: 'REPLACE_WITH_EXPLORER_URL',
};
```

I deliberately left these as placeholders rather than guessing — a wrong
chain ID would silently send players to connect to the wrong network.
Until you fill these in:
- Players can still open TESTNET and connect any injected wallet (MetaMask etc.) — that part is fully real.
- The app will show "not configured" instead of a wrong/fake network check.
- `UNLOCK_RULES` in `web3.js` has one rule (`testnet_runner`, type `WALLET_CONNECTED`) that works immediately with just a connected wallet — the other two rules (`spark_agent`, `vibe_builder`) need a real contract/token address, which also aren't guessed; they report `NOT_CONFIGURED` rather than faking a pass. Tell me the real values (chain, RPC, contract/token addresses) and I'll wire those up properly.

## Audio (optional)

The game looks for these under `assets/` (not included — add your own,
royalty-free or original only):

```
assets/music.mp3
assets/coin.wav
assets/boost.wav
assets/jump.wav
assets/shield.wav
assets/gameover.wav
```

If the folder or any file is missing, that sound is just silently skipped —
nothing breaks. Music starts only after the player presses PLAY (browser
autoplay rules), and the 🔊 button mutes/unmutes (saved to localStorage).

## What's intentionally NOT built yet

Per the spec's own priority order (STABILITY → GAMEPLAY → COINS → VIBE PACK
→ AUDIO → CHARACTERS → TESTNET UNLOCKS → POLISH), this delivers everything
through TESTNET UNLOCKS. Not yet built: TESTNET SHIELD / COIN MAGNET /
TESTNET BOOST power-ups (the spec only required VIBE PACK to be fully
functional; the others are listed as unlockable examples) — say the word
and I'll add them next, once you've confirmed this layer works.

## How to upload

Since this is more files than before, easier than pasting each one: on
GitHub, open `Viberun-game` → **Add file → Upload files** → drag in all
the files from this zip (not the zip itself) → commit. That works fine for
a flat structure like this one — no subfolders to lose.
