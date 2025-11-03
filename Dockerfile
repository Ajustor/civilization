FROM oven/bun:slim AS base

WORKDIR /home/bun/app

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

