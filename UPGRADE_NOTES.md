# VIBE RUNNER — Community + Web3 Upgrade (v2: real testnet config)

Flat structure, same as your repo — no `/src` folder, `index.html` still
loads `game.js` from the root.

## Files in this zip (13)

Replace these at the root of `Viberun-game`:
- `index.html`, `style.css`, `game.js`, `player.js`, `ui.js`

Add/replace these at the root:
- `storage.js` — local progression (best score, VIBE totals, unlocks, achievements, sound pref). Never stores wallet secrets.
- `characters.js` — the 4-character roster and unlock rules.
- `audio.js` — music/SFX manager, missing files fail silently.
- `coins.js` — VIBE Coins: formations, combos, collection.
- `vibepack.js` — the rare VIBE PACK flying power-up.
- `powerups.js` — **new**: free Shield (absorbs one hit) and Speed Boost (4s, 1.35x speed) jump-collectibles.
- `web3.js` — **now fully configured**, see below.

`obstacles.js` is still unchanged — don't need to touch it.

## Testnet config — now real, not placeholders

Confirmed directly from a wallet's "Add Network" screen on your end, not guessed:

```js
chainId: '0xb626',        // 46630 decimal
chainName: 'Robinhood Chain Testnet',
rpcUrl: 'https://rpc.testnet.chain.robinhood.com/rpc',
explorerUrl: 'https://explorer.testnet.chain.robinhood.com',
vibeTokenAddress: '0xaa71ab53A5b85C935955DD88440002dB7a7ED4ec', // $VIBE
```

Unlock rules — plain read-only `balanceOf()` checks against the connected wallet, token decimals read live from the contract (never assumed):

| Character | Requirement |
|---|---|
| Testnet Runner | hold 50 $VIBE |
| Spark Agent | hold 100 $VIBE |
| Vibe Builder | hold 200 $VIBE |

Connecting a wallet, switching network (including auto-adding the chain if
it's not in the wallet yet), and these balance checks are all real and
live now. Still true to the spec's safety rules: no seed phrase/key ever
requested, nothing auto-sent, no transaction triggered by a balance check.

## New gameplay (this round)

- **Progressive speed** — run speed ramps from 1x to 1.7x smoothly over the
  first ~7000px of distance, then holds steady (so a long run stays
  playable instead of becoming impossible).
- **Shield** (🛡️, cyan ring pickup) — absorbs exactly one obstacle hit,
  then is consumed. Free, no wallet needed.
- **Speed Boost** (⚡, amber bolt pickup) — 4 seconds at 1.35x speed. Free,
  no wallet needed.
- Both show a HUD icon while active and are reachable mid-jump like coins.

## Tested before sending

Ran the full flow headlessly (Playwright + Chromium) against these exact
files: PLAY → HUD → jump → collision → game over → restart, character
menu (all 4 cards render, locked ones show their $VIBE requirement),
testnet menu (correctly shows "unavailable" with no wallet present). Zero
JS errors. Also unit-verified the balance-check math and the speed-ramp
curve directly. The one thing I can't test headlessly is a real wallet
connecting to Robinhood Chain Testnet and holding actual $VIBE — that
needs your real MetaMask + funded testnet wallet.

## Audio (optional, unchanged)

Still looks for `assets/music.mp3`, `coin.wav`, `boost.wav`, `jump.wav`,
`shield.wav`, `gameover.wav`. Missing = silently skipped, nothing breaks.

## How to upload

GitHub → `Viberun-game` → **Add file → Upload files** → drag in all files
from this zip (not the zip itself) → commit. Flat structure, no
subfolders to lose.
