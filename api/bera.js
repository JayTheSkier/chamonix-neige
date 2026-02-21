module.exports = async function handler(req, res) {
  const apiKey = process.env.METEOFRANCE_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Server missing METEOFRANCE_API_KEY' }));
    return;
  }

  try {
    const upstream = await fetch(
      'https://public-api.meteofrance.fr/public/DPBRA/v1/massif/BRA?id-massif=3&format=xml',
      { headers: { apikey: apiKey, accept: '*/*' } }
    );

    const xml = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(xml);
  } catch {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Failed to fetch BERA upstream' }));
  }
};
