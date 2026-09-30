const DEEP_URL = "https://api-free.deepl.com/v2/translate";

const TARGET_CODE = {
  ko: "KO",
  en: "EN-US"
} as const;

export async function translateText(text: string, target: "ko" | "en"):Promise<string> {
  const res = await fetch(DEEP_URL, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      target_lang: TARGET_CODE[target],
    }),
  });
  if (!res.ok) {
    throw new Error(`DeepL 요청 실패: ${res.status}`);
  }
  const data = await res.json();
  return data.translations[0].text;
}