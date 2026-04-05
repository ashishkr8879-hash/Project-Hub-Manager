# ── Stage 1: Build Expo Web ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /workspace

RUN npm install -g pnpm@10

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/ ./packages/
COPY artifacts/mobile/ ./artifacts/mobile/

RUN pnpm install --frozen-lockfile

ARG EXPO_PUBLIC_DOMAIN
ENV EXPO_PUBLIC_DOMAIN=$EXPO_PUBLIC_DOMAIN

WORKDIR /workspace/artifacts/mobile

RUN pnpm exec expo export --platform web --output-dir /web-dist

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /web-dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
