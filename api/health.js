import { getStoredUrl, isStorageConfigured } from "./_storage.js";

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.status(200).json({
    ok: true,
    storage_configured: isStorageConfigured(),
    current_url: await getStoredUrl(),
  });
}

