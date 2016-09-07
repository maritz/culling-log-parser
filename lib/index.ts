import DamageSummary from './damageSummary';
import LogEntry from './logEntry';
import Game from './game';
import * as ICullingParser from './definitions/culling';

const verifiedApiVersions: Array<number> = [
  92253, 92358, 92449, 92896, 93315, 93811,
];


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
      errors: [],
      lines: {
        relevant: 0,
        total: 0,
      },
      version: 0,
      warnings: [],
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
      output.meta.version = entry.version.api;

      if (entry.version.api < 92253) {
        const warn = `Parsed old log file that is known to not have kills or deaths.`;
        if (output.meta.warnings.indexOf(warn) === -1) {
          output.meta.warnings.push(warn);
        }
      }
      if (!verifiedApiVersions.indexOf(entry.version.api)) {
        const warn = `Parsed log file that is not from an API Version that is verified: ${entry.version.api}`;
        if (output.meta.warnings.indexOf(warn) === -1) {
          output.meta.warnings.push(warn);
        }
      }
      return;
    }
    if (entry.version.game !== '') {
      // rely on api for now.
      return;
    }
    if (output.meta.version === 0 && entry.isGameStart) {
      const warn = `Parsed log file does not appear to have a recognized version line.`;
      if (output.meta.warnings.indexOf(warn) === -1) {
        output.meta.warnings.push(warn);
      }
    }


    if (entry.region) {
      currentRegion = entry.region;
    }

    currentGame.addEntry(entry);
    if (!entry.isGameEnd && !currentGame.type || currentGame.type === 'unknown' || currentGame.type === 'bot') {
      if (currentGame.type !== 'bot' && !entry.isGameStart && !entry.isGameEnd && !entry.region) {
        output.meta.warnings.push(`Unknown game type, ignoring possibly interesting entry. Gametype: ${
          currentGame.type}, Entry: ${JSON.stringify(entry)}.`);
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
      output.meta.warnings.push(`Someone blocked a backstab?!?!?!?!`);
    }

    if (entry.damage.isBlocked && entry.damage.isAFK) {
      // PogChamp
      console.info('culling-log-parser: ');
      output.meta.warnings.push(`Someone blocked a damage instance from stupid range.
      Rare but can happen, just wanted to let you know.`);
    }

    output.summary.damage.add(entry.damage);
    if (currentGame.isFinished) {
      const finishedGame = currentGame.getResult();
      Object.keys(finishedGame.players).forEach((name) => {
        if (!output.players[name]) {
          output.players[name] = {
            damage: new DamageSummary(),
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

  if (verifiedApiVersions.indexOf(output.meta.version) !== -1 &&
    output.summary.damage.getSummary().dealt.amount > 100 && output.summary.kills === 0) {
    console.log('No kills found in version', output.meta.version, output.summary.damage.getSummary().dealt.amount, output.summary.wins, output.summary.losses, output.summary.deaths, output.start);
  }

  if (output.meta.version < 92253 && output.summary.kills > 0) {
    console.log('Old version that *does* have kills', output.meta.version);
  }

  return output;
}
