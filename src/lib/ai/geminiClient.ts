/* ── archetype-aware fallback pool ── */
const ARCHETYPE_FALLBACKS: Record<string, string[]> = {
  giver: [
    "Your generosity is a gift — today, honour it by setting one small boundary that protects your own financial energy.",
    "Giving starts with having enough. Take a moment to review your own needs before extending to others this week.",
    "Your care for others is beautiful. This week, explore a Money Spirit lesson that helps you sustain that generosity long-term.",
  ],
  keeper: [
    "Your steady foundations are your strength. This week, revisit one area of your finances that could use a small, reassuring check-in.",
    "Security grows with knowledge. Explore the next lesson in your learning path to deepen your financial confidence.",
    "Trust the progress you've already made. Today, reflect on one financial habit that's working well for you.",
  ],
  rebel: [
    "Your independence is powerful. This week, challenge one inherited money belief that no longer serves you.",
    "Convention is optional — your path is your own. Explore a Money Spirit lesson that helps you build on your unique approach.",
    "Your instinct to question is a strength. Channel it today by setting one financial intention that feels truly yours.",
  ],
  seeker: [
    "Your curiosity opens doors. This week, dive into a new lesson and notice what resonates with your lived experience.",
    "Every insight becomes wisdom when you act on it. Choose one small financial step inspired by something you've recently learned.",
    "Exploration is your superpower. Take a moment today to reflect on what your financial journey has taught you so far.",
  ],
  achiever: [
    "Your drive creates momentum. This week, celebrate one financial milestone before setting your sights on the next.",
    "Achievement with alignment is your gift. Revisit your goals and check that they still reflect what matters most to you.",
    "Progress is already happening. Take a moment to acknowledge how far you've come, then choose your next intentional step.",
  ],
};

const GENERIC_FALLBACK =
  "Your next sacred step is to show up for yourself today. Every small action builds the foundation for your financial wellbeing.";

/**
 * Return a fallback that is archetype-aware and avoids recently used lines.
 */
export function getArchetypeFallback(
  archetype?: string | null,
  recentFallbacks: string[] = [],
): string {
  const pool = ARCHETYPE_FALLBACKS[archetype ?? "keeper"] ?? ARCHETYPE_FALLBACKS.keeper;
  const available = pool.filter((f) => !recentFallbacks.includes(f));
  if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return available[Math.floor(Math.random() * available.length)];
}

/* ── Rate-limit aware cooldown ── */
const COOLDOWN_KEY = "gemini_cooldown_until";

function isInCooldown(): boolean {
  try {
    const until = sessionStorage.getItem(COOLDOWN_KEY);
    if (!until) return false;
    if (Date.now() < parseInt(until, 10)) return true;
    sessionStorage.removeItem(COOLDOWN_KEY);
    return false;
  } catch { return false; }
}

function setCooldown(seconds = 60) {
  try { sessionStorage.setItem(COOLDOWN_KEY, String(Date.now() + seconds * 1000)); } catch { /* ignore */ }
}

export async function callGemini(
  prompt: string,
  systemPrompt: string,
): Promise<string> {
  if (isInCooldown()) throw new Error("Gemini rate-limited (cooldown)");

  try {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) throw new Error("No Gemini API key");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 256, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });

    clearTimeout(timeout);

    if (res.status === 429) {
      setCooldown(90);
      throw new Error("Gemini 429");
    }

    if (!res.ok) {
      if (res.status >= 500) setCooldown(30);
      console.warn("Gemini API error:", res.status);
      throw new Error(`Gemini ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text?.trim()) throw new Error("Empty Gemini response");
    return text.trim();
  } catch (err: any) {
    if (err?.message?.includes("429") || err?.message?.includes("cooldown")) {
      // Suppress noisy logging for rate limits
    } else {
      console.warn("Gemini call failed:", err?.message ?? err);
    }
    throw err;
  }
}

export default callGemini;
