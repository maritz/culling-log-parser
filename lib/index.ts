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
    entries: [],
    games: [],
    meta: {
      lines: {
        relevant: 0,
        total: 0,
      },
    },
    players: {},
    start: new Date(),
    summary: {
      damage: new DamageSummary(),
      deaths: 0,
      kills: 0,
      losses: 0,
      wins: 0,
    },
  };
  let startSet = false;
  let currentGame: Game = new Game();
  let currentRegion: ICullingParser.RegionsType = '';

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
      startSet = true;
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
    if (entry.isGameStart) {
      currentGame = new Game();
    }

    if (entry.version.api !== 0) {
      version = entry.version.api;
      if (! verifiedApiVersions.indexOf(entry.version.api)) {
        console.warn('culling-log-parser: WARNING! This log is from a game version that has not been tested!', entry.version.api);
      }
      if (entry.version.api !== 0 && entry.version.api < 92253) {
        console.log(`culling-log-parser: Parsing log with old version that doesn't have reliable kills, deaths, wins or losses.`);
      } else if (entry.version.api !== 0) {
        console.log('Version', entry.version.api);
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


    if (entry.region) {
      currentRegion = entry.region;
    }

    currentGame.addEntry(entry);
    if (!entry.isGameEnd && !currentGame.type || currentGame.type === 'unknown' || currentGame.type === 'bot') {
      if (currentGame.type !== 'bot' && !entry.isGameStart && !entry.isGameEnd && !entry.region) {
        console.log('Unknown game type, ignoring possibly interesting entry', currentGame.type, entry);
      }
      return;
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
    if (currentGame.isFinished) {
      const finishedGame = currentGame.getResult();
      Object.keys(finishedGame.players).forEach((name) => {
        if (!output.players[name]) {
          output.players[name] = {
            damage: new DamageSummary(),
            died: 0,
            killed: 0,
            timesMet: 0,
          };
        }
        output.players[name].damage = output.players[name].damage.addOtherSummary(currentGame.players[name]);
        output.players[name].timesMet++;
      });
      output.games.push(finishedGame);
      currentGame = new Game(currentRegion);
    }

    output.entries.push(entry);
  });

  if (currentGame.start && !currentGame.isFinished) {
    // last game didn't finish according to logs. crashed?
    currentGame.finish(output.entries[output.entries.length - 1]);
    output.games.push(currentGame.getResult());
  }

  return output;
}
