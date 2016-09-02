import DamageSummary from './damageSummary';
import LogEntry from './logEntry';

export default class Game {

  public start: Date | null;
  public end: Date | null;

  public players: {
    [name: string]: DamageSummary
  };
  public damageInstances: Array<{
    name: string
  } & CullingParser.IDamageInstance>;

  public damageSummary: DamageSummary;

  public isWin: boolean;
  public score: number;
  public isFinished: boolean;

  public type: CullingParser.GameModesType;

  private deathWaitingForDamage: boolean;

  constructor() {
    this.start = null;
    this.end = null;
    this.players = {};
    this.damageSummary = new DamageSummary();
    this.damageInstances = [];
    this.isWin = false;
    this.isFinished = false;
    this.deathWaitingForDamage = false;
    this.type = 'custom';
  }

  public addEntry(entry: LogEntry) {
    if (entry.isGameStart) {
      this.start = entry.date || new Date();
    }
    this.addDamage(entry);

    if (entry.gameType.game !== 'custom') {
      this.type = entry.gameType.game;
    }

    // check finish conditions
    if (this.deathWaitingForDamage && entry.damage.received) {
      this.finish(entry);
    } else if (entry.isWin) {
      this.isWin = true;
      this.finish(entry);
    } else if (entry.isDeath) {
      // when hit by direct damage from a player as the killing blow the damage instance
      // is logged after the death and loss message
      this.deathWaitingForDamage = true;
    } else if (entry.isGameEnd) {
      // When hit by indirect damage (gas and possibly others) as the killing blow
      // there is no last damage instance after death and loss. Thus we wait for the
      // main menu entry.
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
        Object.assign<{ name: string }, CullingParser.IDamageInstance>(
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

  public getResult(): CullingParser.IGame {
    const playerNames = Object.keys(this.players);
    const playerObject: {
      [name: string]: CullingParser.IDamageSummary
    } = {};

    for (const name of playerNames) {
      playerObject[name] = this.players[name].getSummary();
    }
    return {
      damageInstances: this.damageInstances,
      damageSummary: this.damageSummary.getSummary(),
      end: this.end,
      isWin: this.isWin,
      mode: this.type,
      players: playerObject,
      score: this.score,
      start: this.start,
    };
  }

}
