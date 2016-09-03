import DamageSummary from '../damageSummary';
import LogEntry from '../logEntry';

export type GameModesType = 'solo' | 'team' | 'custom' | 'lightning' | 'trials' | 'unknown';
export type RegionsType = 'eu' | 'ocn' | 'us-east' | 'us-west' | 'unknown' | '';

const knownRegions: Array<RegionsType> = ['eu', 'us-east', 'us-west', 'ocn'];
export function isRegionsType(str: string): str is RegionsType {
  return knownRegions.indexOf(str as RegionsType) !== -1;
}

export interface ILogEntry {
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

  region: RegionsType;

  version: {
    game: string;
    api: number;
  };

  gameType: {
    game: string;
    level: string;
  };
}

export interface IGame {
  start: Date | null;
  end: Date | null;

  isWin: boolean;
  score: number;

  players: {
    [name: string]: IDamageSummary
  };

  damageInstances: Array<{
    name: string
  } & IDamageInstance>;

  damageSummary: IDamageSummary;
  mode: GameModesType;
  region: RegionsType;
}

export interface IDamageInstance {
  dealt: number;
  received: number;
  range: number;
  isRanged: boolean;
  isHeadshot: boolean;
  isAFK: boolean;
  timestamp: number;
  isBackstab: boolean;
  isBlocked: boolean;
  block: number;
}

export interface IDamageSummaryDamage {
  amount: number;
  count: number;
  averageRange: number;
  backstabCount: number;
  meleeBlockCount: number;
  rangeBlockCount: number;
  headshotCount: number;
}

export interface IDamageSummaryDealtAndReceived {
  dealt: IDamageSummaryDamage;
  received: IDamageSummaryDamage;
}

export interface IDamageSummary {
  dealt: IDamageSummaryDamage;
  received: IDamageSummaryDamage;
  melee: IDamageSummaryDealtAndReceived;
  ranged: IDamageSummaryDealtAndReceived;
  afk: IDamageSummaryDealtAndReceived;
  averageRange: number;
}

export interface IParseLogResponseCloneable {
  meta: {
    lines: {
      total: number;
      relevant: number;
    }
  };
  entries: Array<ILogEntry>;
  games: Array<IGame>;
  players: {
    [name: string]: IDamageSummary
  };
  summary: {
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    damage: IDamageSummary;
  };
}


export interface IParseLogOptions {
  ignoreBots?: boolean;
}

export interface IParseLogOutput {
  start: Date;
  end: Date;
  meta: {
    lines: {
      total: number;
      relevant: number;
    }
  };
  entries: Array<LogEntry>;
  games: Array<IGame>;
  players: {
    [name: string]: DamageSummary
  };
  summary: {
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    damage: DamageSummary;
  };
}
