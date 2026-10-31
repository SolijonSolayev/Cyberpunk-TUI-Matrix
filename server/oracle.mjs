export async function generateOracle(question, {apiKey, model = 'gemini-2.5-flash', fetchImpl = fetch} = {}) {
  if (typeof question !== 'string' || !question.trim() || question.length > 2000) {
    return {status: 400, body: {error: 'Savol 1–2000 belgidan iborat bo‘lishi kerak.'}};
  }
  if (!apiKey) return {status: 503, body: {error: 'Jonli AI sozlanmagan. Oflayn rejimdan foydalaning.'}};
  try {
    const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'x-goog-api-key': apiKey},
      body: JSON.stringify({
        systemInstruction: {parts: [{text: 'Siz 2099-yil kiberpank terminalidagi AI yordamchisiz. Qisqa va o‘zbek tilida javob bering.'}]},
        contents: [{role: 'user', parts: [{text: question.trim()}]}],
        generationConfig: {maxOutputTokens: 512}
      }),
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error('upstream unavailable');
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('').trim();
    if (!text) throw new Error('empty response');
    return {status: 200, body: {text}};
  } catch {
    // Never expose upstream responses or credentials to the browser/logs.
    return {status: 502, body: {error: 'AI xizmati javob bermadi. Oflayn rejimdan foydalaning.'}};
  }
}
