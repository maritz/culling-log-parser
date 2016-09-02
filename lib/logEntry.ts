const knownGameModeMap: {[key: string]: CullingParser.GameModesType} = {
  'VictoryGameMode_Solo.VictoryGameMode_Solo_C': 'solo',
  'VictoryGameMode.VictoryGameMode_C': 'team', // Team games
  'VictoryGameMode_Lightning.VictoryGameMode_Lightning_C': 'lightning',
  'VictoryGameMode_Custom.VictoryGameMode_Custom_C': 'custom',
  'VictoryGameMode_TrialsSolo.VictoryGameMode_TrialsSolo_C': 'trials',
};


export default class LogEntry implements CullingParser.ILogEntry {

  public date: Date | null;
  public moduleName: string;

  public interesting: boolean;

  public isGameStart: boolean;
  public isGameEnd: boolean;
  public isWin: boolean;
  public isLoss: boolean;
  public score: number;
  public otherPlayer: string;
  public damage: CullingParser.IDamageInstance;
  public isKill: boolean;
  public isDeath: boolean;
  public isAFK: boolean;
  public version: {
    game: string;
    api: number;
  };
  public gameType: {
    game: CullingParser.GameModesType;
    level: string;
  };

  constructor(private fullLine: string) {
    this.damage = {
      block: 0,
      dealt: 0,
      isAFK: false,
      isBackstab: false,
      isBlocked: false,
      isHeadshot: false,
      isRanged: false,
      range: 0,
      received: 0,
      timestamp: 0,
    };
    this.isGameStart = false;
    this.isGameEnd = false;
    this.isWin = false;
    this.isLoss = false;
    this.otherPlayer = '';
    this.isKill = false;
    this.isDeath = false;
    this.score = 0;

    this.version = {
      api: 0,
      game: '',
    };

    this.gameType = {
      game: 'custom',
      level: '',
    };

    this.interesting = false;

    this.date = this.parseDate();
    this.moduleName = this.parseModuleName();
  }

  public parse(options: CullingParser.ILogParserOptions) {
    this.parseVersion();
    this.parseGameState();
    this.parseGameType();
    this.parseDamage(options.ignoreBots);
    this.parseRankScoring();
  }

  /**
   * Returns a date object parsed from the line or null if the line doesn't start with a date string.
   *
   * @param {string} line
   * @returns {Date}
   */
  private parseDate(): Date | null {
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

  private parseModuleName() {
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

  private parseVersion() {
    if (this.moduleName !== 'LogInit') {
      return;
    }
    const str = this.fullLine.substr(9);
    if (str.indexOf('Version:') === 0) {
      // LogInit: Version: 4.11.2-93315+++RedHarvest+Staging
      this.version.game = str.substr(18);
      this.interesting = true;
    } else if (str.indexOf('API Version:') === 0) {
      // LogInit: API Version: 93315
      this.version.api = parseInt(str.substr(13), 10);
      this.interesting = true;
    }
  }

  private parseGameState() {
    if (this.moduleName !== 'LogOnline') {
      return;
    }
    const str = this.fullLine.substr(41);
    if (str.indexOf('GotoState: NewState: Playing') !== -1) {
      // [2016.08.19-18.46.20:992][464]LogOnline: GotoState: NewState: Playing
      this.isGameStart = true;
    } else if (str.indexOf('GotoState: NewState: MainMenu') !== -1) {
      // [2016.08.19-18.51.49:605][325]LogOnline: GotoState: NewState: MainMenu
      this.isGameEnd = true;
    }
  }

  private parseGameType() {
    // [2016.08.19-18.22.20:122][671]LogNet: Welcomed by server (Level: /Game/Maps/Jungle/Jungle_P, Game: /Game/Blueprints/GameMode/VictoryGameMode_Solo.VictoryGameMode_Solo_C)
    if (this.moduleName !== 'LogNet') {
      return;
    }
    const str = this.fullLine.substr(38);
    if (str.indexOf('Welcomed by server') === -1) {
      return;
    }
    const matches = str.match(/\(Level: \/Game\/Maps\/([^,]+), Game: \/Game\/Blueprints\/GameMode\/([^\)]+)\)/i);
    if (!matches) {
      console.warn('culling-log-parser: WARNING! Found a server welcome that didn\'t match expected format',
        this.fullLine);
      return;
    }
    this.interesting = true;
    let mode = knownGameModeMap[matches[2]];
    if (!mode) {
      console.warn('culling-log-parser: WARNING! Found an unknown game mode; setting it to custom',
        matches[2], this.fullLine);
      mode = 'custom';
    }
    this.gameType = {
      game: mode,
      level: matches[1],
    };
  }

  private parseDamage(ignoreBots = false) {
    // [2016.08.19-18.26.16:881][344]VictoryDamage:Display: You Hit ${username} for 22.43 damage (1.77 m)  BACKSTAB!
    if (this.moduleName !== 'VictoryDamage:Display') {
      return;
    }
    const str = this.fullLine.substr(53);
    let values = str.match(/You hit (.*) for (-?[\d\.]+) damage \(([\d\.]+)\ m\)/i);
    let isHit = true;
    if (!values) {
      isHit = false;
      values = str.match(/Struck by (.*) for (-?[\d\.]+) damage \(([\d\.]+)\ m\)/i);
    }
    if (!values) {
      console.error('VictoryDamage:Display with wrong format', str);
      return;
    }
    this.interesting = true;
    this.otherPlayer = values[1];
    if (ignoreBots && this.otherPlayer.match(/<BOT>[\d]-[A-F0-9]{32}/)) {
      this.interesting = false;
      return;
    }
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

    const blockMatch = str.match(/BLOCKED ([\d]+)%/i);
    if (blockMatch) {
      this.damage.isBlocked = true;
      this.damage.block = parseInt(blockMatch[1], 10);
      if (this.damage.block === 50) {
        this.damage.isRanged = true;
      } else if (this.damage.block !== 100 && this.damage.block !== 25) { // 25% is blocking with chainsaw equipped
        console.info('culling-log-parser: Found abnormal block value!', blockMatch[1], this.fullLine);
      }
    }

    if (str.match('BACKSTAB!')) {
      this.damage.isBackstab = true;
    }

    if (str.match('HEADSHOT!')) {
      this.damage.isHeadshot = true;
    }
  }

  private parseRankScoring() {
    // [2016.08.19-18.54.47:810][117]LogOnline:Warning: RankScoring kill: -1073741824
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

}
