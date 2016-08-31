import * as fs from 'fs';

import parseLog from './lib';

parseLog(fs.createReadStream('testlog.txt'))
  .then(
    (result) => {
      console.log('result', result);
      /*console.log(`Parsed log. Filtered out ${result.totalLines - entries.length} lines. Used lines: ${entries.length}`);
      console.log(`Damge: dealt ${damageDone}; received ${damageReceived}`);
      console.log(`Killed ${kills} players. Died ${deaths} times.`);
      console.log(`Damage dealt per kill ${damageDone / kills} players. Damage taken per kill ${damageReceived / kills}.`);
      console.log(`Won ${wins} out of ${wins + losses} games.`);*/
    },
    (error) => {
      console.log('error', error);
    }
  );

export default parseLog;