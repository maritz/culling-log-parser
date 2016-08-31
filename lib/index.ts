import * as readline from 'readline';
import * as streamify from 'streamifier';
import * as isStream from 'is-stream';

import DamageSummary from './damageSummary';
import LogEntry from './logEntry';


export default function parseLog(input: any): Promise<CullingParser.parseLogResponse> {

  return new Promise<CullingParser.parseLogResponse>((resolve, reject) => {
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
    const damageSummary = new DamageSummary()

    let inputStream = input;
    if (! isStream.readable(inputStream)) {
      inputStream = streamify.createReadStream(input);
    }
    const byLine = readline.createInterface({ input: inputStream });

    byLine
      .on('line', (line: string) => {
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

        // damage
        damageSummary.add(entry.damage);

        response.entries.push(entry);
      })
      .on('close', () => {
        response.summary.damage = damageSummary.getSummary();
        resolve(response);
      });
  })
}
