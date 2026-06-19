import { getStoredUrl, isStorageConfigured } from "./_storage.js";

function appendQuery(url, params) {
  const parsed = new URL(url);

  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, value == null ? "" : String(value));
  }

  return parsed.toString();
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  let body = {};

  if (request.method === "POST") {
    body = typeof request.body === "object" && request.body ? request.body : {};
  }

  try {
    const baseUrl = await getStoredUrl();
    const url = appendQuery(baseUrl, {
      sub_id_1: body.af_sub1 || body.deep_link_sub1 || "",
      sub_id_2: body.af_sub2 || "",
      sub_id_3: body.af_adset || body.af_sub3 || "",
      sub_id_4: body.af_ad || body.af_sub4 || "",
      sub_id_5: body.store_id || "id6770539278",
      sub_id_7: body.push_token || "",
      sub_id_10: body.af_id || "",
      sub_id_11: body.media_source || "",
      deep_link_value: body.deep_link_value || "",
    });

    response.status(200).json({
      ok: true,
      url,
      base_url: baseUrl,
      storage_configured: isStorageConfigured(),
      expires: Math.floor(Date.now() / 1000) + 86400,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

