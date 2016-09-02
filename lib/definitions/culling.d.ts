declare namespace CullingParser {

  interface ILogParserOptions {
    ignoreBots: boolean;
  }

  type GameModesType = 'solo' | 'team' | 'custom' | 'lightning' | 'trials';

  interface ILogEntry {
    date: Date | null;
    moduleName: string;

    interesting: boolean;

    isGameStart: boolean;
    isGameEnd: boolean;
    isWin: boolean;
    isLoss: boolean;
    score: number;
    otherPlayer: string;
    damage: IDamageInstance;
    isKill: boolean;
    isDeath: boolean;
    isAFK: boolean;

    version: {
      game: string;
      api: number;
    }

    gameType: {
      game: string;
      level: string;
    }
  }

  interface IGame {
    start: Date | null;
    end: Date | null;

    isWin: boolean;
    score: number;

    players: {
      [name: string]: IDamageSummary
    };

    damageInstances: Array<{
      name: string
    } & IDamageInstance>,

    damageSummary: IDamageSummary;
    mode: GameModesType;
  }

  interface IDamageInstance {
    dealt: number,
    received: number,
    range: number,
    isRanged: boolean,
    isHeadshot: boolean,
    isAFK: boolean,
    timestamp: number,
    isBackstab: boolean,
    isBlocked: boolean,
    block: number,
  }

  interface IDamageSummaryDamage {
    amount: number,
    count: number,
    averageRange: number,
    backstabCount: number,
    meleeBlockCount: number,
    rangeBlockCount: number,
    headshotCount: number,
  }

  interface IDamageSummaryDealtAndReceived {
    dealt: IDamageSummaryDamage,
    received: IDamageSummaryDamage,
  }

  interface IDamageSummary {
    dealt: IDamageSummaryDamage,
    received: IDamageSummaryDamage,
    melee: IDamageSummaryDealtAndReceived,
    ranged: IDamageSummaryDealtAndReceived,
    afk: IDamageSummaryDealtAndReceived,
    averageRange: number,
  }

  export interface parseLogResponse {
    meta: {
      lines: {
        total: number,
        relevant: number,
      }
    },
    entries: Array<ILogEntry>,
    games: Array<IGame>,
    players: {
      [name: string]: IDamageSummary
    }
    summary: {
      wins: number,
      losses: number,
      kills: number,
      deaths: number,
      damage: IDamageSummary,
    }
  }

}
