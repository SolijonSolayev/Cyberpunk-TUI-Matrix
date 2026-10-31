import {generateOracle} from '../server/oracle.mjs';

// Vercel Node function. Credentials stay in server-side environment variables.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error: 'Faqat POST so‘rovi qabul qilinadi.'});
  }
  const result = await generateOracle(req.body?.question, {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  });
  return res.status(result.status).json(result.body);
}
