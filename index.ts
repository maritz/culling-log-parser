import * as fs from 'fs';

import parseLog from './lib/index';

if (require.main === module) {
  parseLog(fs.createReadStream('testlog.txt'))
    .then(
      (result) => {
        const game = result.games[5];
        console.log('players', game.players);
        console.log(`Won ${result.summary.wins} out of ${result.summary.wins + result.summary.losses} games.`);

        //console.log(JSON.stringify(result));
      },
      (error) => {
        console.log('error', error);
      }
    );
}

export default parseLog;