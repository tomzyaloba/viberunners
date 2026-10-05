// Character roster. Stats are small multipliers, not new mechanics, so the
// base game stays balanced and every character is fully playable.
// `unlock` describes how the character becomes available; `WALLET_FREE`
// means every player has it with no wallet involved.

export const CHARACTERS = [
  {
    id: 'base_runner',
    name: 'BASE RUNNER',
    tagline: 'Balanced.',
    stats: { speed: 3, jump: 3, coinBonus: 3 },
    speedMul: 1,
    jumpMul: 1,
    coinMul: 1,
    boostMul: 1,
    recoveryMul: 1,
    unlock: { type: 'WALLET_FREE' },
  },
  {
    id: 'testnet_runner',
    name: 'TESTNET RUNNER',
    tagline: 'Better coin collection.',
    stats: { speed: 3, jump: 3, coinBonus: 4 },
    speedMul: 1,
    jumpMul: 1,
    coinMul: 1.25,
    boostMul: 1,
    recoveryMul: 1,
    unlock: { type: 'UNLOCK_RULE', ruleId: 'testnet_runner' },
  },
  {
    id: 'spark_agent',
    name: 'SPARK AGENT',
    tagline: 'Better boost duration.',
    stats: { speed: 3, jump: 3, boost: 5 },
    speedMul: 1,
    jumpMul: 1,
    coinMul: 1,
    boostMul: 1.4,
    recoveryMul: 1,
    unlock: { type: 'UNLOCK_RULE', ruleId: 'spark_agent' },
  },
  {
    id: 'vibe_builder',
    name: 'VIBE BUILDER',
    tagline: 'Slightly stronger obstacle recovery.',
    stats: { speed: 3, jump: 4, recovery: 4 },
    speedMul: 1,
    jumpMul: 1.08,
    coinMul: 1,
    boostMul: 1,
    recoveryMul: 1.2,
    unlock: { type: 'UNLOCK_RULE', ruleId: 'vibe_builder' },
  },
];

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}

export function isCharacterUnlocked(character, progress) {
  if (character.unlock.type === 'WALLET_FREE') return true;
  return progress.unlockedCharacters.includes(character.id);
}
