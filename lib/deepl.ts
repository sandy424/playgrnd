const DEEP_URL = "https://api-free.deepl.com/v2/translate";

const TARGET_CODE = {
  ko: "KO",
  en: "EN-US"
} as const;

export async function translateTexts(texts: string[], target: "ko" | "en"): Promise<string[]> {
  if (texts.length === 0) return [];
  if (!process.env.DEEPL_API_KEY) {
    throw new Error("DEEPL_API_KEY is not configured");
  }

  const res = await fetch(DEEP_URL, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: texts,
      target_lang: TARGET_CODE[target],
    }),
  });
  if (!res.ok) {
    throw new Error(`DeepL 요청 실패: ${res.status}`);
  }
  const data = await res.json() as { translations?: { text: string }[] };
  if (!data.translations || data.translations.length !== texts.length) {
    throw new Error("DeepL returned an unexpected number of translations");
  }
  return data.translations.map((translation) => translation.text);
}

export async function translateText(text: string, target: "ko" | "en"): Promise<string> {
  const [translated] = await translateTexts([text], target);
  return translated;
}