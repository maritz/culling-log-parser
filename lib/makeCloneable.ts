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
    response.players[name] = {
      damage: rawResponse.players[name].damage.getSummary(),
      died: rawResponse.players[name].died,
      killed: rawResponse.players[name].killed,
      timesMet: rawResponse.players[name].timesMet,
    };
  });
  return response;
}
