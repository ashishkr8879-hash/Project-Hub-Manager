# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /workspace

RUN npm install -g pnpm@10

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/ ./packages/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /workspace/artifacts/api-server/dist ./dist

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
