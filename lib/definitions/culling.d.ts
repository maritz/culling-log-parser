declare namespace CullingParser {

  interface ILogEntry {
    date: Date | null;
    moduleName: string;

    interesting: boolean;

    isRoundStart: boolean;
    isRoundEnd: boolean;
    isWin: boolean;
    isLoss: boolean;
    score: number;
    otherPlayer: string;
    damage: IDamageInstance;
    isKill: boolean;
    isDeath: boolean;
    isAFK: boolean;
  }

  interface IGame {
    start: Date | null;
    end: Date | null;

    isWin: boolean;
    isTeamGame: boolean;
    score: number;

    players: {
      [name: string]: IDamageSummary
    };

    damageInstances: Array<{
      name: string
    } & IDamageInstance>,

    damageSummary: IDamageSummary;
  }

  interface IDamageInstance {
    dealt: number,
    received: number,
    range: number,
    isRanged: boolean,
    isAFK: boolean,
    timestamp: number
  }

  interface IDamageSummaryDamage {
    amount: number,
    count: number,
    averageRange: number,
  }

  interface IDamageSummaryDealtAndReceived {
    dealt: IDamageSummaryDamage,
    received: IDamageSummaryDamage
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
        relevant: number
      }
    },
    entries: Array<ILogEntry>,
    games: Array<IGame>,
    summary: {
      wins: number,
      losses: number,
      kills: number,
      deaths: number,
      damage: IDamageSummary
    }
  }

}
