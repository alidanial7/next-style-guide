# Docker

Production image: `docker/production.Dockerfile`.

Requires `output: "standalone"` in `next.config.ts` (set by the Docker installer).

```bash
docker build -f docker/production.Dockerfile \
  --build-arg NEXT_PUBLIC_APP_URL=https://example.com \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  -t __PROJECT_SLUG__ .
```

Runner exposes `3000`. See `.dockerignore`.
