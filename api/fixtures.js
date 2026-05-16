export default async function handler(req, res) {
  const { competitions, dateFrom, dateTo } = req.query;

  const url = `https://api.football-data.org/v4/matches?competitions=${competitions}&dateFrom=${dateFrom}&dateTo=${dateTo}`;

  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': process.env.REACT_APP_FOOTBALLDATA_KEY,
    },
  });

  const data = await response.json();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(response.status).json(data);
}
