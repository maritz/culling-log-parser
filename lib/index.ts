import DamageSummary from './damageSummary';
import LogEntry from './logEntry';
import Game from './game';

const verifiedApiVersions: Array<number> = [];

export default function parseLog(
  input: string,
  options: CullingParser.ILogParserOptions = {
    ignoreBots: false,
  }
): CullingParser.parseLogResponse {

  const modules: Array<string> = [];
  const response = {
    entries: <Array<LogEntry>> [],
    games: <Array<CullingParser.IGame>> [],
    meta: {
      lines: {
        relevant: 0,
        total: 0,
      },
    },
    players: <{ [name: string]: CullingParser.IDamageSummary }> {},
    summary: {
      damage: <CullingParser.IDamageSummary> {},
      deaths: 0,
      kills: 0,
      losses: 0,
      wins: 0,
    },
  };
  const damageSummary = new DamageSummary();
  const playerSummary: { [name: string]: DamageSummary } = {};
  let currentGame: Game = new Game();

  let version = 0;

  const lines = input.split('\n');
  lines.forEach((line, lineno) => {
    response.meta.lines.total++;
    const entry = new LogEntry(line);

    if (modules.indexOf(entry.moduleName) === -1) {
      modules.push(entry.moduleName);
    }

    entry.parse(options);
    if (!entry.interesting) {
      return;
    } else {
      response.meta.lines.relevant++;
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
      response.summary.kills++;
    }
    if (entry.isDeath) {
      response.summary.deaths++;
    }
    if (entry.isWin) {
      response.summary.wins++;
    }
    if (entry.isLoss) {
      response.summary.losses++;
    }

    if (entry.damage.isBlocked && entry.damage.isBackstab) {
      // BrokeBack
      console.warn('culling-log-parser: WARNING! Someone blocked a backstab?!?!?!?!');
    }

    if (entry.damage.isBlocked && entry.damage.isAFK) {
      // PogChamp
      console.info('culling-log-parser: Someone blocked a damage instance from stupid range. Rare but can happen.');
    }

    damageSummary.add(entry.damage);
    currentGame.addEntry(entry);
    if (currentGame.isFinished) {
      response.games.push(currentGame.getResult());
      currentGame = new Game();
    }
    if (!playerSummary[entry.otherPlayer]) {
      playerSummary[entry.otherPlayer] = new DamageSummary();
    }
    playerSummary[entry.otherPlayer].add(entry.damage);

    response.entries.push(entry);
  });

  if (currentGame.start && !currentGame.isFinished) {
    // last game didn't finish according to logs. crashed?
    currentGame.finish(response.entries[response.entries.length - 1]);
    response.games.push(currentGame.getResult());
  }
  Object.keys(playerSummary).forEach((name) => {
    response.players[name] = playerSummary[name].getSummary();
  });
  response.summary.damage = damageSummary.getSummary();
  return response;

}
