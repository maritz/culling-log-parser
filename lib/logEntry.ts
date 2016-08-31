export default class LogEntry {

  public date: Date | null;
  public moduleName: string;

  public damageDealt: number;
  public damageReceived: number;
  public damageRange: number;
  public isRanged: boolean;
  public isRoundStart: boolean;
  public isRoundEnd: boolean;
  public isWin: boolean;
  public isLoss: boolean;
  public otherPlayer: string;
  public isKill: boolean;
  public isDeath: boolean;
  public isAFK: boolean;
  public score: number;

  public interesting: boolean;

  constructor(private fullLine: string) {
    this.damageDealt = 0;
    this.damageReceived = 0;
    this.damageRange = 0;
    this.isRanged = false;
    this.isWin = false;
    this.isLoss = false;
    this.otherPlayer = '';
    this.isKill = false;
    this.isDeath = false;
    this.isAFK = false;
    this.score = 0;

    this.interesting = false;

    this.date = this.parseDate();
    this.moduleName = this.parseModuleName();
  }

  parse() {

    this.parseDamage();
    this.parseRankScoring();
  }

  /**
   * Returns a date object parsed from the line or null if the line doesn't start with a date string.
   *
   * @param {string} line
   * @returns {Date}
   */
  parseDate(): Date | null {
    if (!this.fullLine.match(/^\[[\d\.\-:]+]/)) {
      return null;
    }
    const date = new Date();
    date.setFullYear(parseInt(this.fullLine.substr(1, 4), 10));
    date.setMonth(parseInt(this.fullLine.substr(6, 2), 10));
    date.setDate(parseInt(this.fullLine.substr(9, 2), 10));
    date.setHours(parseInt(this.fullLine.substr(12, 2), 10));
    date.setMinutes(parseInt(this.fullLine.substr(15, 2), 10));
    date.setSeconds(parseInt(this.fullLine.substr(18, 2), 10));
    date.setMilliseconds(parseInt(this.fullLine.substr(21, 3), 10));
    return date;
  }

  parseModuleName() {
    let line = this.fullLine;
    if (this.date) {
      line = line.substr(30);
    }
    const match = line.match(/^[^\s]+/);
    if (!match) {
      return 'NoModuleFound';
    }
    const name = match[0].replace(/:$/, '');
    return name;
  }

  parseDamage() {
    if (this.moduleName !== 'VictoryDamage:Display') {
      return;
    }
    const str = this.fullLine.substr(53);
    let values = str.match(/You hit (.*) for ([\d\.]+) damage \(([\d\.]+)\ m\)/i);
    let isHit = true;
    if (!values) {
      isHit = false;
      values = str.match(/Struck by (.*) for ([\d\.]+) damage \(([\d\.]+)\ m\)/i);
    }
    if (!values) {
      console.error('VictoryDamage:Display with wrong format', str);
      return;
    }
    this.interesting = true;
    this.otherPlayer = values[1];
    const damage = parseInt(values[2], 10);
    if (isHit) {
      this.damageDealt = damage;
    } else {
      this.damageReceived = damage;
    }
    this.damageRange = parseInt(values[3], 10);
    if (this.damageRange > 3) { // value based on scientific studies using the well know method of "guessing"
      this.isRanged = true;
      if (this.damageRange > 300) {
        // realistically most of the time you do damage over 300m away, it is with traps or alarm guns
        this.isAFK = true;
      }
    }
  }

  parseRankScoring() {
    if (this.moduleName !== 'LogOnline:Warning') {
      return;
    }
    const str = this.fullLine.substr(49);
    const match = str.match(/RankScoring (win|loss|kill|death): [\d]/i);
    if (match) {
      this.interesting = true;
      switch (match[1]) {
        case 'win':
          this.isWin = true;
          break;
        case 'loss':
          this.isLoss = true;
          break;
        case 'kill':
          this.isKill = true;
          break;
        case 'death':
          this.isDeath = true;
          break;
        default:
          console.error('Found unknown RankScoring value:' + str);
      }
    }
  }

}