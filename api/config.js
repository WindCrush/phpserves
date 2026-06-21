import { getStoredUrl, isStorageConfigured, saveRequestHistory } from "./_storage.js";

function hasAttributionData(body) {
  const status = String(body.af_status || "").trim().toLowerCase();
  return status === "non-organic" || status === "non organic";
}

function appendQuery(url, params) {
  const parsed = new URL(url);

  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, value == null ? "" : String(value));
  }

  return parsed.toString();
}

function mask(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const string = String(value);
  return string.length <= 10 ? string : `${string.slice(0, 6)}...${string.slice(-4)}`;
}

function payloadSummary(body) {
  return {
    af_status: body.af_status ?? null,
    af_id: mask(body.af_id),
    campaign: body.campaign ?? body.c ?? null,
    campaign_id: body.campaign_id ?? body.af_c_id ?? null,
    media_source: body.media_source ?? body.pid ?? null,
    af_channel: body.af_channel ?? body.channel ?? null,
    af_adset: body.af_adset ?? body.adset ?? null,
    af_ad: body.af_ad ?? body.ad ?? null,
    af_sub1: mask(body.af_sub1 ?? body.deep_link_sub1),
    af_sub2: mask(body.af_sub2 ?? body.deep_link_sub2),
    af_sub3: mask(body.af_sub3 ?? body.deep_link_sub3),
    af_sub4: mask(body.af_sub4 ?? body.deep_link_sub4),
    af_sub5: mask(body.af_sub5 ?? body.deep_link_sub5),
    has_push_token: Boolean(body.push_token),
    has_apns_token: Boolean(body.apns_token),
    firebase_project_id: body.firebase_project_id ?? null,
    bundle_id: body.bundle_id ?? null,
    os: body.os ?? null,
    store_id: body.store_id ?? null,
    locale: body.locale ?? null,
  };
}

async function recordHistory(body, decision, responseBody) {
  try {
    await saveRequestHistory({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toISOString(),
      decision,
      summary: payloadSummary(body),
      response: {
        ok: responseBody.ok,
        message: responseBody.message ?? null,
        error: responseBody.error ?? null,
        base_url: responseBody.base_url ?? null,
        storage_configured: responseBody.storage_configured ?? isStorageConfigured(),
        expires: responseBody.expires ?? null,
      },
    });
  } catch (error) {
    console.error("history save failed", error);
  }
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  let body = {};

  if (request.method === "POST") {
    body = typeof request.body === "object" && request.body ? request.body : {};
  }

  try {
    if (!hasAttributionData(body)) {
      const responseBody = {
        ok: false,
        message: "No data",
        storage_configured: isStorageConfigured(),
      };

      await recordHistory(body, {
        status: "no_data",
        reason: "Missing af_status Non-organic",
        returned_base_url: null,
      }, responseBody);

      response.status(200).json(responseBody);
      return;
    }

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

    const responseBody = {
      ok: true,
      url,
      base_url: baseUrl,
      storage_configured: isStorageConfigured(),
      expires: Math.floor(Date.now() / 1000) + 86400,
    };

    await recordHistory(body, {
      status: "url_returned",
      reason: "af_status is Non-organic",
      returned_base_url: baseUrl,
      base_url: baseUrl,
    }, responseBody);

    response.status(200).json(responseBody);
  } catch (error) {
    const responseBody = {
      ok: false,
      error: error.message,
    };

    await recordHistory(body, {
      status: "error",
      reason: error.message,
      returned_base_url: null,
    }, responseBody);

    response.status(500).json(responseBody);
  }
}
