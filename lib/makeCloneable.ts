import * as ICullingParser from './definitions/culling';

export default function makeCloneable(rawResponse: ICullingParser.IParseLogOutput) {
  const response: ICullingParser.IParseLogResponseCloneable = {
    entries: rawResponse.entries,
    games: rawResponse.games,
    meta: rawResponse.meta,
    players: {},
    summary: {
      damage: rawResponse.summary.damage.getSummary(),
      deaths: rawResponse.summary.deaths,
      kills: rawResponse.summary.kills,
      losses: rawResponse.summary.losses,
      wins: rawResponse.summary.wins,
    },
  };
  Object.keys(rawResponse.players).forEach((name) => {
    response.players[name] = {
      damage: rawResponse.players[name].damage.getSummary(),
      timesMet: rawResponse.players[name].timesMet,
    };
  });
  return response;
}
