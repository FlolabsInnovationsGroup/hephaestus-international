# syntax=docker/dockerfile:1.7
FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS builder
ARG NEXT_PUBLIC_STRAPI_URL
ARG BUILD_COMMIT_SHA
ARG BUILD_COMMIT_REF
ARG BUILD_IMAGE_TAG
ARG BUILD_TIMESTAMP
ENV NEXT_PUBLIC_STRAPI_URL=$NEXT_PUBLIC_STRAPI_URL
ENV BUILD_COMMIT_SHA=$BUILD_COMMIT_SHA
ENV BUILD_COMMIT_REF=$BUILD_COMMIT_REF
ENV BUILD_IMAGE_TAG=$BUILD_IMAGE_TAG
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ARG BUILD_COMMIT_SHA
ARG BUILD_COMMIT_REF
ARG BUILD_IMAGE_TAG
ARG BUILD_TIMESTAMP
ENV NODE_ENV=production
ENV BUILD_COMMIT_SHA=$BUILD_COMMIT_SHA
ENV BUILD_COMMIT_REF=$BUILD_COMMIT_REF
ENV BUILD_IMAGE_TAG=$BUILD_IMAGE_TAG
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./next.config.js
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]
