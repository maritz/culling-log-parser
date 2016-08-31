import * as readline from 'readline';
import * as streamify from 'streamifier';
import * as isStream from 'is-stream';

import LogEntry from './logEntry';

export interface parseLogResponse {
  meta: {
    lines: {
      total: number,
      relevant: number
    }
  },
  summary: {
    wins: number,
    losses: number,
    kills: number,
    deaths: number,
    damage: {
      dealt: number,
      received: number,
      melee: number,
      ranged: number,
      averageRange: number,
      counts: {
        melee: number,
        ranged: number,
        afk: number
      }
    }
  }
}

export default function parseLog(input: any): Promise<parseLogResponse> {

  return new Promise((resolve, reject) => {
    const modules: Array<string> = [];
    const response: parseLogResponse = {
      meta: {
        lines: {
          total: 0,
          relevant: 0
        }
      },
      summary: {
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        damage: {
          dealt: 0,
          received: 0,
          melee: 0,
          ranged: 0,
          averageRange: 0,
          counts: {
            melee: 0,
            ranged: 0,
            afk: 0
          }
        }
      }
    };

    let inputStream = input;
    if (! isStream.readable(inputStream)) {
      inputStream = streamify.createReadStream(input);
    }
    const byLine = readline.createInterface({ input: inputStream });

    const entries: Array<LogEntry> = [];

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
        response.summary.damage.dealt += entry.damageDealt;
        response.summary.damage.received += entry.damageReceived;
        if (entry.isRanged) {
          response.summary.damage.ranged += entry.damageDealt;
          response.summary.damage.counts.ranged++;
          if (entry.isAFK) {
            response.summary.damage.counts.afk++;
          }
        } else {
          response.summary.damage.melee += entry.damageDealt;
          response.summary.damage.counts.melee++;
        }

        entries.push(entry);
      })
      .on('close', () => {
        resolve(response);
      });
  })
}
