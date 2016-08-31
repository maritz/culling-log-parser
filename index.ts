import * as fs from 'fs';

import parseLog from './lib/index';

parseLog(fs.createReadStream('testlog.txt'))
  .then(
    (result) => {
      const game = result.games[5];
      console.log('start', game.start);
      console.log('players', game.players);
      console.log(`Won ${result.summary.wins} out of ${result.summary.wins + result.summary.losses} games.`);
      /*console.log(`Parsed log. Filtered out ${result.totalLines - entries.length} lines. Used lines: ${entries.length}`);
      console.log(`Damge: dealt ${damageDone}; received ${damageReceived}`);
      console.log(`Killed ${kills} players. Died ${deaths} times.`);
      console.log(`Damage dealt per kill ${damageDone / kills} players. Damage taken per kill ${damageReceived / kills}.`);
      */
    },
    (error) => {
      console.log('error', error);
    }
  );

export default parseLog;