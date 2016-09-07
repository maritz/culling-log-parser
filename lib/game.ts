import DamageSummary from './damageSummary';
import LogEntry from './logEntry';
import * as ICullingParser from './definitions/culling';

let idCounter = Date.now();

export default class Game {
  public id: number;

  public start: Date | null;
  public end: Date | null;

  public players: {
    [name: string]: DamageSummary
  };
  public damageInstances: Array<{
    name: string
  } & ICullingParser.IDamageInstance>;

  public damageSummary: DamageSummary;

  public isBotGame: boolean;

  public kills: number;
  public isWin: boolean;
  public isLoss: boolean;
  public score: number;
  public isFinished: boolean;

  public type: ICullingParser.GameModesType;
  public region: ICullingParser.RegionsType;

  private deathWaitingForDamage: boolean;

  constructor(region: ICullingParser.RegionsType = '') {
    this.id = ++idCounter;
    this.start = null;
    this.end = null;
    this.players = {};
    this.damageSummary = new DamageSummary();
    this.damageInstances = [];
    this.kills = 0;
    this.isWin = false;
    this.isLoss = false;
    this.isFinished = false;
    this.deathWaitingForDamage = false;
    this.type = '';
    this.region = region;
    this.isBotGame = true;
  }

  public addEntry(entry: LogEntry) {
    if (entry.isGameStart) {
      this.start = entry.date || new Date();
    }
    this.addDamage(entry);

    if (entry.gameType.game !== '') {
      this.type = entry.gameType.game;
    }
    if (entry.region) {
      this.region = entry.region;
    }
    if (entry.isKill) {
      this.kills++;
    }

    // check finish conditions
    if (this.deathWaitingForDamage && entry.damage.isReceived) {
      this.finish(entry);
    } else if (entry.isWin) {
      this.isWin = true;
    } else if (entry.isDeath || entry.isLoss) {
      // when hit by direct damage from a player as the killing blow the damage instance
      // is usually logged after the death and loss message
      this.isLoss = true;
      this.deathWaitingForDamage = true;
    } else if (this.start && entry.isGameEnd) {
      // When hit by indirect damage (gas and possibly others) as the killing blow
      // there is no last damage instance after death and loss. Thus we wait for the
      // main menu entry, marked as isGameEnd.
      // The reason we can't just always wait for isGameEnd is that crashlogs would not have
      // an end entry and so could introduce problems.
      // Also this way of doing it allows for a better estimate on actual gameplay time.
      this.finish(entry);
    }
  }

  private addDamage(entry: LogEntry) {
    if (entry.damage.dealt || entry.damage.received || entry.damage.isBlocked) {
      this.damageSummary.add(entry.damage);


      if (!this.players[entry.otherPlayer]) {
        this.players[entry.otherPlayer] = new DamageSummary();
      }
      this.players[entry.otherPlayer].add(entry.damage);

      this.damageInstances.push(
        Object.assign<{ name: string }, ICullingParser.IDamageInstance>(
          {
            name: entry.otherPlayer,
          },
          entry.damage
        )
      );
    }
  }

  public finish(entry: LogEntry) {
    if (entry.date) {
      this.end = entry.date;
    }
    if (!isNaN(entry.score)) {
      this.score = entry.score;
    }
    this.isFinished = true;
  }

  public getResult(): ICullingParser.IGame {
    const playerNames = Object.keys(this.players);
    const playerObject: {
      [name: string]: {
        damage: ICullingParser.IDamageSummary;
        killed: boolean;
        died: boolean;
      }
    } = {};

    for (const name of playerNames) {
      playerObject[name] = {
        damage: this.players[name].getSummary(),
        died: false,
        killed: false,
      };
    }
    return {
      damageInstances: this.damageInstances,
      damageSummary: this.damageSummary.getSummary(),
      end: this.end || new Date(0),
      id: this.id,
      isLoss: this.isLoss,
      isWin: this.isWin,
      kills: this.kills,
      mode: this.type,
      players: playerObject,
      region: this.region,
      score: this.score,
      start: this.start || new Date(0),
    };
  }

}
