import DamageSummary from './damageSummary';
import LogEntry from './logEntry';
import Game from './game';
import * as ICullingParser from './definitions/culling';

const verifiedApiVersions: Array<number> = [];


export default function parseLog(
  input: string,
  options: ICullingParser.IParseLogOptions = {
    ignoreBots: false,
  }
): ICullingParser.IParseLogOutput {

  const modules: Array<string> = [];
  const output: ICullingParser.IParseLogOutput = {
    end: new Date(),
    entries: <Array<LogEntry>> [],
    games: <Array<ICullingParser.IGame>> [],
    meta: {
      lines: {
        relevant: 0,
        total: 0,
      },
    },
    players: <{ [name: string]: DamageSummary }> {},
    start: new Date(),
    summary: {
      damage: <DamageSummary> {},
      deaths: 0,
      kills: 0,
      losses: 0,
      wins: 0,
    },
  };
  const startSet = false;
  const playerSummary: { [name: string]: DamageSummary } = {};
  let currentGame: Game = new Game();

  let version = 0;

  const lines = input.split('\n');
  lines.forEach((line, lineno) => {
    output.meta.lines.total++;
    const entry = new LogEntry(line);

    if (modules.indexOf(entry.moduleName) === -1) {
      modules.push(entry.moduleName);
    }

    entry.parse(options);

    if (!startSet && entry.date) {
      output.start = entry.date;
    }
    if (entry.date) {
      output.end = entry.date;
    }

    if (!entry.interesting) {
      return;
    } else {
      output.meta.lines.relevant++;
    }

    if (entry.version.api !== 0) {
      version = entry.version.api;
      if (! verifiedApiVersions.indexOf(entry.version.api)) {
        console.warn('culling-log-parser: WARNING! This log is from a game version that has not been tested!', entry.version.api);
      }
      return;
    }
    if (entry.version.game !== '') {
      // rely on api for now.
      return;
    }

    if (version === 0 && entry.isGameStart) {
      console.warn('culling-log-parser: WARNING! This log does not appear to have a recognized version line.');
    }

    if (entry.isKill) {
      output.summary.kills++;
    }
    if (entry.isDeath) {
      output.summary.deaths++;
    }
    if (entry.isWin) {
      output.summary.wins++;
    }
    if (entry.isLoss) {
      output.summary.losses++;
    }

    if (entry.damage.isBlocked && entry.damage.isBackstab) {
      // BrokeBack
      console.warn('culling-log-parser: WARNING! Someone blocked a backstab?!?!?!?!');
    }

    if (entry.damage.isBlocked && entry.damage.isAFK) {
      // PogChamp
      console.info('culling-log-parser: Someone blocked a damage instance from stupid range. Rare but can happen.');
    }

    output.summary.damage.add(entry.damage);
    currentGame.addEntry(entry);
    if (currentGame.isFinished) {
      output.games.push(currentGame.getResult());
      currentGame = new Game();
    }
    if (!playerSummary[entry.otherPlayer]) {
      playerSummary[entry.otherPlayer] = new DamageSummary();
    }
    playerSummary[entry.otherPlayer].add(entry.damage);

    output.entries.push(entry);
  });

  if (currentGame.start && !currentGame.isFinished) {
    // last game didn't finish according to logs. crashed?
    currentGame.finish(output.entries[output.entries.length - 1]);
    output.games.push(currentGame.getResult());
  }
  Object.keys(playerSummary).forEach((name) => {
    output.players[name] = playerSummary[name];
  });

  return output;
}
