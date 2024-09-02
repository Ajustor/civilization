migrate-hard:
	rm -rd drizzle || true
	rm -rd apps/back/drizzle || true
	rm -r apps/back/*.db  || true
	rm -r apps/back/*.sqlite || true
	bun back:generate:migrations
	bun back:migrate
	bun back:populate

generate-migrations:
	bun back:generate:migrations

migrate:
	bun back:migrate
