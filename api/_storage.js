const DEFAULT_URL = process.env.DEFAULT_URL || "https://www.google.com/";
const CONFIG_KEY = process.env.CONFIG_KEY || "polus_url";

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

export function isStorageConfigured() {
  return Boolean(redisConfig());
}

