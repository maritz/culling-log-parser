export default class LogEntry implements CullingParser.ILogEntry {

  public date: Date | null;
  public moduleName: string;

  public interesting: boolean;

  public isRoundStart: boolean;
  public isRoundEnd: boolean;
  public isWin: boolean;
  public isLoss: boolean;
  public isGoingBackToMainMenu: boolean;
  public score: number;
  public otherPlayer: string;
  public damage: CullingParser.IDamageInstance;
  public isKill: boolean;
  public isDeath: boolean;
  public isAFK: boolean;

  constructor(private fullLine: string) {
    this.damage = {
      timestamp: 0,
      dealt: 0,
      received: 0,
      range: 0,
      isRanged: false,
      isAFK: false
    };
    this.isRoundStart = false;
    this.isRoundEnd = false;
    this.isWin = false;
    this.isLoss = false;
    this.isGoingBackToMainMenu = false;
    this.otherPlayer = '';
    this.isKill = false;
    this.isDeath = false;
    this.score = 0;

    this.interesting = false;

    this.date = this.parseDate();
    this.moduleName = this.parseModuleName();
  }

  parse() {
    this.parseDamage();
    this.parseRankScoring();
    this.parseGoingBackToMainMenu();
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
    if (this.date) {
      this.damage.timestamp = this.date.getTime();
    }
    const damage = parseInt(values[2], 10);
    if (isHit) {
      this.damage.dealt = damage;
    } else {
      this.damage.received = damage;
    }
    this.damage.range = parseInt(values[3], 10);
    if (this.damage.range > 3) { // value based on scientific studies using the well know method of "guessing"
      this.damage.isRanged = true;
      if (this.damage.range > 300) {
        // realistically most of the time you do damage over 300m away, it is with traps or alarm guns
        this.damage.isAFK = true;
      }
    }
  }

  parseRankScoring() {
    if (this.moduleName !== 'LogOnline:Warning') {
      return;
    }
    const str = this.fullLine.substr(49);
    const match = str.match(/RankScoring (win|loss|kill|death): (-?[\d]+)/i);
    if (match) {
      this.interesting = true;
      this.score = parseInt(match[2], 10);
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

  parseGoingBackToMainMenu() {
    if (this.moduleName !== 'LogOnline') {
      return;
    }
    const str = this.fullLine.substr(41);
    if (str === 'GotoState: NewState: MainMenu') {
      this.isGoingBackToMainMenu = true;
    }
  }

}
