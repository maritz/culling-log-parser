import * as ICullingParser from './definitions/culling';

export default function makeCloneable(rawResponse: ICullingParser.IParseLogOutput) {
  const response: ICullingParser.IParseLogResponseCloneable = {
    entries: rawResponse.entries,
    games: rawResponse.games,
    meta: rawResponse.meta,
    players: {},
    summary: {
      damage: rawResponse.summary.damage.getSummary(),
      deaths: 0,
      kills: 0,
      losses: 0,
      wins: 0,
    },
  };
  Object.keys(rawResponse.players).forEach((name) => {
    response.players[name] = rawResponse.players[name].getSummary();
  });
  return response;
}
