import DamageSummary from './damageSummary';
import LogEntry from './logEntry';
import Game from './game';


export default function parseLog(input: string): CullingParser.parseLogResponse {

  const modules: Array<string> = [];
  const response = {
    meta: {
      lines: {
        total: 0,
        relevant: 0
      }
    },
    entries: <Array<LogEntry>>[],
    games: <Array<any>>[],
    summary: {
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      damage: <CullingParser.IDamageSummary>{}
    }
  };
  const damageSummary = new DamageSummary();
  let currentGame = new Game();

  const lines = input.split('\n');
  lines.forEach((line) => {
    response.meta.lines.total++;
    const entry = new LogEntry(line);

    if (modules.indexOf(entry.moduleName) === -1) {
      modules.push(entry.moduleName);
    }

    entry.parse();
    if (!entry.interesting) {
      return;
    } else {
      response.meta.lines.relevant++;
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

    damageSummary.add(entry.damage);
    currentGame.addEntry(entry);
    if (currentGame.isFinished) {
      response.games.push(currentGame.getResult());
      currentGame = new Game();
    }

    response.entries.push(entry);
  });

  if (currentGame.start && !currentGame.isFinished) {
    // last game didn't finish according to logs. crashed?
    currentGame.finish(response.entries[response.entries.length - 1]);
    response.games.push(currentGame);
  }
  response.summary.damage = damageSummary.getSummary();
  return response;

}
