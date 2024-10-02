build-deps:
	bun build:deps

migrate-hard:
	rm -rd drizzle || true
	rm -rd apps/back/drizzle || true
	rm -r apps/back/*.db  || true
	rm -r apps/back/*.sqlite || true
	bun back:generate:migrations
	bun back:migrate
	bun back:populate

generate-migrations: build-deps
	bun back:generate:migrations

migrate:
	bun back:migrate

init-front:
	docker compose run --rm front bun i
	
init-back:
	docker compose run --rm back bun i

init: init-front init-back

start-front:
	docker compose up -d front

start-back:
	docker compose up -d back

start: start-back start-front

stop-front:
	docker compose down front

stop-back:
	docker compose down back

stop: stop-back stop-front

populate:
	docker compose run --rm back bun populate

build-front:
	docker compose run --rm front bun run build

build-back:
	docker compose run --rm back bun run build

build: build-back build-front