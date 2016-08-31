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

  public isTeamGame: boolean;
  public isWin: boolean;
  public score: number;
  public isFinished: boolean;

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
  }

  addEntry(entry: LogEntry) {
    if (!this.start && entry.date) {
      this.start = entry.date;
    }
    this.addDamage(entry);

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
    } else if (entry.isGoingBackToMainMenu) {
      // when hit by indirect damage (gas and possibly others) as the killing blow
      // there is no last damage instance after death and loss. thus we wait for the
      // main menu entry
      this.finish(entry);
    }
  }

  private addDamage(entry: LogEntry) {
    if (entry.damage.dealt || entry.damage.received) {
      this.damageSummary.add(entry.damage);


      if (!this.players[entry.otherPlayer]) {
        this.players[entry.otherPlayer] = new DamageSummary();
      }
      this.players[entry.otherPlayer].add(entry.damage);

      this.damageInstances.push(
        Object.assign<{ name: string }, CullingParser.IDamageInstance>(
          {
            name: entry.otherPlayer
          },
          entry.damage
        )
      );
    }
  }

  finish(entry: LogEntry) {
    if (entry.date) {
      this.end = entry.date;
    }
    this.isFinished = true;
  }

  getResult(): CullingParser.IGame {
    return <any>{};
  }

}
