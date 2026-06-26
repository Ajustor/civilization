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
RUN bun build:front

FROM base AS build-back
WORKDIR /home/bun/app
RUN bun build:back

FROM base AS front
WORKDIR /home/bun/app/apps/front
COPY --from=build-front /home/bun/app/apps/front/build ./dist

FROM base AS back
WORKDIR /home/bun/app/apps/back
COPY --from=build-back /home/bun/app/apps/back/dist ./dist

ENV NODE_ENV=production
ENV APP_PORT=3000
EXPOSE 3000

CMD ["bun", "dist/index.js"]