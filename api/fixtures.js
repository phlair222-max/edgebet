export default async function handler(req, res) {
  var competitions = req.query.competitions;
  var dateFrom = req.query.dateFrom;
  var dateTo = req.query.dateTo;

  var url = 'https://api.football-data.org/v4/matches?competitions=' + competitions + '&dateFrom=' + dateFrom + '&dateTo=' + dateTo;

  var response = await fetch(url, {
    headers: {
      'X-Auth-Token': process.env.REACT_APP_FOOTBALLDATA_KEY || '36f65f997b7c4e698fe90b8741745505',
    },
  });

  var data = await response.json();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(response.status).json(data);
}
