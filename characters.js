// Character roster.
//
// The BASE RUNNER is the standard free character.
//
// The three testnet characters are premium characters unlocked through
// $VIBE token balances on the Robinhood Chain Testnet.
//
// Each premium character has a distinctive visual identity and a unique
// starting advantage:
//
// TESTNET RUNNER
// - Starts with a shield
// - Shield lasts 3x the normal duration
//
// SPARK AGENT
// - Starts with a VIBE PACK / jetpack
// - Flight lasts 3x the normal duration
//
// VIBE BUILDER
// - Starts with both shield + VIBE PACK
// - Shield lasts 4x the normal duration
// - Flight lasts 4x the normal duration
//
// Stats are intentionally kept moderate. The biggest differences come
// from each character's starting power-up and visual identity.

export const CHARACTERS = [
  {
    id: 'base_runner',

    name: 'BASE RUNNER',

    tagline: 'Balanced. Built for everyone.',

    stats: {
      speed: 3,
      jump: 3,
      coinBonus: 3,
    },

    speedMul: 1,
    jumpMul: 1,
    coinMul: 1,
    boostMul: 1,
    recoveryMul: 1,

    // No starting power-ups.
    startShieldMul: 0,
    startFlightMul: 0,

    visual: {
      primary: '#7c3aed',
      secondary: '#22d3ee',
      accent: '#f472b6',
      visor: '#22d3ee',
      trail: '#39ffce',
      aura: '#7c3aed',
      premium: false,
    },

    unlock: {
      type: 'WALLET_FREE',
    },
  },

  {
    id: 'testnet_runner',

    name: 'TESTNET RUNNER',

    tagline: 'Shielded from the first step. 3× shield duration.',

    stats: {
      speed: 4,
      jump: 3,
      coinBonus: 4,
    },

    speedMul: 1.03,
    jumpMul: 1,
    coinMul: 1.25,
    boostMul: 1,
    recoveryMul: 1,

    // Starts with a shield lasting 3x the normal duration.
    startShieldMul: 3,
    startFlightMul: 0,

    visual: {
      primary: '#0ea5e9',
      secondary: '#22d3ee',
      accent: '#67e8f9',
      visor: '#cffafe',
      trail: '#22d3ee',
      aura: '#0ea5e9',
      premium: true,
      armor: true,
    },

    unlock: {
      type: 'UNLOCK_RULE',
      ruleId: 'testnet_runner',
    },
  },

  {
    id: 'spark_agent',

    name: 'SPARK AGENT',

    tagline: 'Starts airborne. 3× VIBE PACK duration.',

    stats: {
      speed: 4,
      jump: 4,
      boost: 5,
    },

    speedMul: 1.05,
    jumpMul: 1.04,
    coinMul: 1,
    boostMul: 1.4,
    recoveryMul: 1,

    // Starts with a VIBE PACK lasting 3x the normal duration.
    startShieldMul: 0,
    startFlightMul: 3,

    visual: {
      primary: '#f59e0b',
      secondary: '#f97316',
      accent: '#fde047',
      visor: '#fff7ed',
      trail: '#f59e0b',
      aura: '#f97316',
      premium: true,
      armor: true,
      energyCore: true,
    },

    unlock: {
      type: 'UNLOCK_RULE',
      ruleId: 'spark_agent',
    },
  },

  {
    id: 'vibe_builder',

    name: 'VIBE BUILDER',

    tagline: 'Elite runner. 4× shield + 4× VIBE PACK.',

    stats: {
      speed: 5,
      jump: 4,
      coinBonus: 5,
    },

    speedMul: 1.08,
    jumpMul: 1.06,
    coinMul: 1.1,
    boostMul: 1.15,
    recoveryMul: 1.25,

    // Ultimate starting loadout.
    startShieldMul: 4,
    startFlightMul: 4,

    visual: {
      primary: '#a855f7',
      secondary: '#ec4899',
      accent: '#facc15',
      visor: '#fef3c7',
      trail: '#c084fc',
      aura: '#a855f7',
      premium: true,
      armor: true,
      energyCore: true,
      crown: true,
    },

    unlock: {
      type: 'UNLOCK_RULE',
      ruleId: 'vibe_builder',
    },
  },
];

export function getCharacter(id) {
  return (
    CHARACTERS.find(
      (character) => character.id === id
    ) || CHARACTERS[0]
  );
}

export function isCharacterUnlocked(character, progress) {
  if (
    character.unlock.type === 'WALLET_FREE'
  ) {
    return true;
  }

  return progress.unlockedCharacters.includes(
    character.id
  );
}
