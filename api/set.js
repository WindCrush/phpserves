import { isStorageConfigured, setStoredUrl } from "./_storage.js";

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  if (request.method !== "POST") {
    response.status(405).json({ ok: false, error: "Use POST." });
    return;
  }

  if (!isStorageConfigured()) {
    response.status(500).json({
      ok: false,
      error: "Storage is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel env vars.",
    });
    return;
  }

  const url = String((request.body && request.body.url) || "").trim();

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("URL must start with http:// or https://");
    }

    await setStoredUrl(parsed.toString());
    response.status(200).json({ ok: true, url: parsed.toString() });
  } catch (error) {
    response.status(400).json({ ok: false, error: error.message });
  }
}

