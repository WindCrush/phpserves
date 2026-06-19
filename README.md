# Polus Config Vercel

Small Vercel app for testing remote config URL changes.

## What it gives

After deploy:

```text
https://your-vercel-project.vercel.app/api/config
```

Put this URL into the app. Open the project home page to change the web URL returned by config.

## Required storage

Vercel serverless functions cannot reliably save edits to local files. Use free Upstash Redis REST.

Create a free Redis database at Upstash, then add these env vars in Vercel:

```text
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
CONFIG_KEY=polus_url
DEFAULT_URL=https://www.google.com/
```

`CONFIG_KEY` and `DEFAULT_URL` are optional.

## Deploy

1. Push this folder to GitHub as a repo.
2. In Vercel, click `Add New...` -> `Project`.
3. Import the GitHub repo.
4. Add the env vars above.
5. Deploy.

## Endpoints

Config endpoint for app:

```text
/api/config
```

Set URL:

```text
/api/set
```

Health check:

```text
/api/health
```

