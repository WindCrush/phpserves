const DEFAULT_URL = process.env.DEFAULT_URL || "https://www.google.com/";
const CONFIG_KEY = process.env.CONFIG_KEY || "polus_url";
const HISTORY_KEY = process.env.HISTORY_KEY || "polus_config_history";
const HISTORY_LIMIT = Number(process.env.HISTORY_LIMIT || 20);

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    token,
  };
}

async function redisCommand(command) {
  const config = redisConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed: ${response.status}`);
  }

  return response.json();
}

export async function getStoredUrl() {
  const data = await redisCommand(["GET", CONFIG_KEY]);
  const value = data && typeof data.result === "string" ? data.result : "";

  return value || DEFAULT_URL;
}

export async function setStoredUrl(url) {
  await redisCommand(["SET", CONFIG_KEY, url]);
}

export async function saveRequestHistory(entry) {
  if (!redisConfig()) {
    return;
  }

  const serialized = JSON.stringify(entry);
  await redisCommand(["LPUSH", HISTORY_KEY, serialized]);
  await redisCommand(["LTRIM", HISTORY_KEY, 0, HISTORY_LIMIT - 1]);
}

export async function getRequestHistory() {
  const data = await redisCommand(["LRANGE", HISTORY_KEY, 0, HISTORY_LIMIT - 1]);
  const items = Array.isArray(data?.result) ? data.result : [];

  return items.flatMap((item) => {
    try {
      return [JSON.parse(item)];
    } catch {
      return [];
    }
  });
}

export async function clearRequestHistory() {
  await redisCommand(["DEL", HISTORY_KEY]);
}

export function isStorageConfigured() {
  return Boolean(redisConfig());
}
