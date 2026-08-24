# Multi-stage production image for Hypertron frontend (Elastic Beanstalk / Docker)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY vendor/hypertron-prover-wasm ./vendor/hypertron-prover-wasm
RUN npm install

COPY . .

# NEXT_PUBLIC_* is inlined at build time. Pass these as --build-arg (or EB/CodeBuild env).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DEVELOPER_API_URL
ARG NEXT_PUBLIC_INDEXER_URL
ARG NEXT_PUBLIC_APP_ORIGIN
ARG NEXT_PUBLIC_STELLAR_NETWORK=testnet
ARG NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
ARG NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
ARG NEXT_PUBLIC_PAYMENT_POOL_ADDRESS
ARG NEXT_PUBLIC_INDEXER_NETWORK=testnet
ARG NEXT_PUBLIC_USDC_ISSUER
ARG NEXT_PUBLIC_EURC_ISSUER

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_DEVELOPER_API_URL=$NEXT_PUBLIC_DEVELOPER_API_URL \
    NEXT_PUBLIC_INDEXER_URL=$NEXT_PUBLIC_INDEXER_URL \
    NEXT_PUBLIC_APP_ORIGIN=$NEXT_PUBLIC_APP_ORIGIN \
    NEXT_PUBLIC_STELLAR_NETWORK=$NEXT_PUBLIC_STELLAR_NETWORK \
    NEXT_PUBLIC_HORIZON_URL=$NEXT_PUBLIC_HORIZON_URL \
    NEXT_PUBLIC_SOROBAN_RPC_URL=$NEXT_PUBLIC_SOROBAN_RPC_URL \
    NEXT_PUBLIC_PAYMENT_POOL_ADDRESS=$NEXT_PUBLIC_PAYMENT_POOL_ADDRESS \
    NEXT_PUBLIC_INDEXER_NETWORK=$NEXT_PUBLIC_INDEXER_NETWORK \
    NEXT_PUBLIC_USDC_ISSUER=$NEXT_PUBLIC_USDC_ISSUER \
    NEXT_PUBLIC_EURC_ISSUER=$NEXT_PUBLIC_EURC_ISSUER \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup -S hypertron && adduser -S hypertron -G hypertron

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER hypertron
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "const p=process.env.PORT||3000; fetch('http://127.0.0.1:'+p+'/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
