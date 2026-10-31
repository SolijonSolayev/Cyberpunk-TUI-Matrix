export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ok: true, oracle: process.env.GEMINI_API_KEY ? 'configured' : 'offline'});
}
