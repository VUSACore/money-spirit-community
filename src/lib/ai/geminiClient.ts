const FALLBACK = "Your next sacred step is to show up for yourself today. Every small action builds the foundation for your financial wellbeing.";

export async function callGemini(prompt: string, systemPrompt: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return FALLBACK;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      }),
    });

    if (!res.ok) {
      console.error("Gemini API error:", res.status);
      return FALLBACK;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || FALLBACK;
  } catch (err) {
    console.error("Gemini call failed:", err);
    return FALLBACK;
  }
}

export default callGemini;
