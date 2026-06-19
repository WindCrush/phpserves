import { clearRequestHistory, getRequestHistory, isStorageConfigured } from "./_storage.js";

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    if (request.method === "DELETE") {
      await clearRequestHistory();
      response.status(200).json({ ok: true, storage_configured: isStorageConfigured() });
      return;
    }

    if (request.method !== "GET") {
      response.status(405).json({ ok: false, error: "Use GET or DELETE." });
      return;
    }

    const history = await getRequestHistory();
    response.status(200).json({
      ok: true,
      storage_configured: isStorageConfigured(),
      count: history.length,
      history,
    });
  } catch (error) {
    response.status(500).json({ ok: false, error: error.message });
  }
}
