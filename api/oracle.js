import {checkBotId} from 'botid/server';
import {generateOracle} from '../server/oracle.mjs';

export function createOracleHandler({verify = checkBotId, generate = generateOracle} = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({error: 'Faqat POST so‘rovi qabul qilinadi.'});
    }
    try {
      const verification = await verify({
        // Never allow the SDK's development bypass on Vercel deployments.
        developmentOptions: {isDevelopment: process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production'},
        advancedOptions: {checkLevel: 'basic'}
      });
      if (verification.isBot) {
        return res.status(403).json({error: 'Avtomatik so‘rov bloklandi.'});
      }
      if (!verification.isHuman) throw new Error('Unverified request');
    } catch {
      // Fail closed: a verification outage must not consume Gemini quota.
      return res.status(503).json({error: 'Xavfsizlik tekshiruvi bajarilmadi. Qayta urinib ko‘ring.'});
    }
    const result = await generate(req.body?.question, {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      history: req.body?.history, context: req.body?.context
    });
    return res.status(result.status).json(result.body);
  };
}

export default createOracleHandler();
