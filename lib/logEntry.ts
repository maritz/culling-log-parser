import * as ICullingParser from './definitions/culling';
const knownGameModeMap: { [key: string]: ICullingParser.GameModesType } = {
  'VictoryGameMode_Solo.VictoryGameMode_Solo_C': 'solo',
  'VictoryGameMode.VictoryGameMode_C': 'team', // Team games
  'VictoryGameMode_Lightning.VictoryGameMode_Lightning_C': 'lightning',
  'VictoryGameMode_Custom.VictoryGameMode_Custom_C': 'custom',
  'VictoryGameMode_TrialsSolo.VictoryGameMode_TrialsSolo_C': 'trials',
};

export default class LogEntry implements ICullingParser.ILogEntry {

  public date: Date | null;
  public moduleName: string;

  public interesting: boolean;

  public isGameStart: boolean;
  public isGameEnd: boolean;
  public isWin: boolean;
  public isLoss: boolean;
  public score: number;
  public otherPlayer: string;
  public damage: ICullingParser.IDamageInstance;
  public isKill: boolean;
  public isDeath: boolean;
  public version: {
    game: string;
    api: number;
  };
  public gameType: {
    game: ICullingParser.GameModesType;
    level: string;
  };
  public region: ICullingParser.RegionsType;

  constructor(private fullLine: string) {
    this.damage = {
      block: 0,
      dealt: 0,
      isAFK: false,
      isBackstab: false,
      isBlocked: false,
      isDealt: true,
      isHeadshot: false,
      isRanged: false,
      isReceived: false,
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
    this.region = '';

    this.version = {
      api: 0,
      game: '',
    };

    this.gameType = {
      game: '',
      level: '',
    };

    this.interesting = false;

    this.date = this.parseDate();
    this.moduleName = this.parseModuleName();
  }

  public parse(options: any) {
    this.parseVersion();
    this.parseRegion();
    this.parseGameState();
    this.parseGameType();
    this.parseIsBotGame()
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
    const year = this.fullLine.substr(1, 4);
    const month = this.fullLine.substr(6, 2);
    const day = this.fullLine.substr(9, 2);
    const hours = this.fullLine.substr(12, 2);
    const minutes = this.fullLine.substr(15, 2);
    const seconds = this.fullLine.substr(18, 2);
    const milliseconds = this.fullLine.substr(21, 3);
    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`);
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
    let str = this.fullLine.substr(9);
    if (this.date) {
      str = this.fullLine.substr(39);
    }
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

  private parseRegion() {
    // [2016.09.03-12.49.07:119][375]FrontEnd:Display: appid is 437220, using url https://clientweb-eu.theculling.net/api
    if (this.moduleName !== 'FrontEnd:Display') {
      return;
    }
    const str = this.fullLine.substr(48);
    const match = str.match(/appid is [\d]+, using url https?:\/\/clientweb-([^\.]+).theculling.net\/api/i);
    if (match) {
      this.interesting = true;
      const region = match[1];
      if (ICullingParser.isRegionsType(region)) {
        this.region = region;
      } else {
        this.region = 'unknown';
      }
    }
  }

  private parseGameState() {
    if (this.moduleName !== 'LogOnline') {
      return;
    }
    const str = this.fullLine.substr(41);
    if (str.indexOf('GotoState: NewState: Playing') !== -1) {
      // [2016.08.19-18.46.20:992][464]LogOnline: GotoState: NewState: Playing
      this.interesting = true;
      this.isGameStart = true;
    } else if (str.indexOf('GotoState: NewState: MainMenu') !== -1) {
      // [2016.08.19-18.51.49:605][325]LogOnline: GotoState: NewState: MainMenu
      this.isGameEnd = true;
      this.interesting = true;
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
      console.warn('culling-log-parser: WARNING! Found an unknown game mode.', matches[2], this.fullLine);
      mode = 'unknown';
    }
    this.gameType = {
      game: mode,
      level: matches[1],
    };
  }

  private parseIsBotGame() {
    //[2016.04.12-10.27.36:654][433]LogLoad: LoadMap: /Game/Maps/Tutorial/Tutorial_v2_Advanced?game=/Game/Blueprints/GameMode/VictoryTutorial.VictoryTutorial_C?bExitOnRoundComplete=true
    if (this.moduleName !== 'LogLoad') {
      return;
    }
    const str = this.fullLine.substr(38);
    if (str.match(/LoadMap: (?:[\d\.]+)?\/?\/Game\/Maps\/(?:Tutorial|Jungle\/Jungle_P\?bEnableBots)/i)) {
      this.gameType.game = 'bot';
      this.interesting = true;
    }
  }

  private parseDamage(ignoreBots = false) {
    // [2016.08.19-18.26.16:881][344]VictoryDamage:Display: You Hit ${username} for 22.43 damage (1.77 m)  BACKSTAB!
    if (this.moduleName !== 'VictoryDamage:Display') {
      return;
    }
    const str = this.fullLine.substr(53);
    let values = str.match(/You hit (.*) for (-?[\d\.]+) damage \(([\d\.]+)\ m\)/i);
    if (!values) {
      this.damage.isDealt = false;
      this.damage.isReceived = true;
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
    if (this.damage.isDealt) {
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
        this.damage.isRanged = true; // explosions as well? TODO: test this
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
