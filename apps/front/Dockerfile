# Front (SvelteKit) image for Dokploy.
#
# This is a monorepo workspace, so the Docker build context MUST be the
# repository root. In Dokploy configure the application as:
#   - Build type     : Dockerfile
#   - Dockerfile path : apps/front/Dockerfile
#   - Build context   : . (repository root)
#
# PUBLIC_BACK_URL is read through SvelteKit's $env/static/public, which inlines
# it at BUILD time. It therefore has to be supplied as a build argument, not a
# runtime variable.
FROM oven/bun:slim AS base

WORKDIR /home/bun/app

ENV NX_DAEMON=false
# NX 22 isolates plugins in worker processes that fail to spawn in this restricted
# build environment ("Failed to start plugin worker"). Run plugins in-process instead.
ENV NX_ISOLATE_PLUGINS=false

COPY . .

RUN bun install
RUN bun build:deps
RUN bun install

FROM base AS build-front
WORKDIR /home/bun/app

ARG PUBLIC_BACK_URL=https://civilization-api.darthoit.eu
ENV PUBLIC_BACK_URL=$PUBLIC_BACK_URL

RUN bun build:front

FROM base AS front
WORKDIR /home/bun/app/apps/front

# adapter-node output. node_modules (with production deps) is already present in
# the base layer and inherited here, which the standalone server needs at runtime.
COPY --from=build-front /home/bun/app/apps/front/build ./build

ENV NODE_ENV=production
# adapter-node listens on $PORT (default 3000) and binds 0.0.0.0 by default.
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "./build/index.js"]
