const SOURCES = {
  'gold-coast-seaway': 'https://www.bom.gov.au/fwo/IDQ60801/IDQ60801.94580.json',
  'brisbane': 'https://www.bom.gov.au/fwo/IDQ60801/IDQ60801.94576.json',
  'coolangatta': 'https://www.bom.gov.au/fwo/IDQ60801/IDQ60801.94592.json'
};

export default async function handler(req, res) {
  const station = String(req.query?.station || 'gold-coast-seaway');
  const url = SOURCES[station] || SOURCES['gold-coast-seaway'];
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'GENEVIEVE-App/1.0' } });
    if (!response.ok) throw new Error(`BOM HTTP ${response.status}`);
    const data = await response.json();
    const observations = data?.observations?.data || [];
    const latest = observations[0];
    if (!latest) throw new Error('No observation data');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
    res.status(200).json({
      source: 'Bureau of Meteorology',
      station: latest.name || station,
      localDateTime: latest.local_date_time_full || latest.local_date_time || null,
      temperatureC: latest.air_temp ?? null,
      apparentC: latest.apparent_t ?? null,
      humidity: latest.rel_hum ?? null,
      windDir: latest.wind_dir ?? null,
      windKmh: latest.wind_spd_kmh ?? null,
      gustKmh: latest.gust_kmh ?? null,
      rainSince9amMm: latest.rain_trace ?? null
    });
  } catch (error) {
    res.status(502).json({ error: 'Live BOM observation temporarily unavailable', detail: String(error?.message || error) });
  }
}
