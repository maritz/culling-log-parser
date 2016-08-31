import * as fs from 'fs';

import parseLog from './lib/index';

if (require.main === module) {

  const result = parseLog(fs.readFileSync('testlog.txt', 'utf-8'));
  const game = result.games[5];
  console.log('players', game.players['Trix4er'].melee);
  console.log(`Won ${result.summary.wins} out of ${result.summary.wins + result.summary.losses} games.`);

  //console.log(JSON.stringify(result));
}

export default parseLog;