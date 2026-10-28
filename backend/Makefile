# Perintah developer backend MasterPro. Jalankan dari folder backend/.
.PHONY: dev build lint fmt test test-integration migrate-new tidy

GOFLAGS ?=
TEST_DATABASE_URL ?= postgres://masterpro:masterpro-local-password@localhost:5432/masterpro_test?sslmode=disable

dev: ## jalankan API dengan hot reload (butuh air & env lengkap)
	air -c .air.toml

build: ## build binary ke ./tmp
	CGO_ENABLED=0 go build -trimpath -o ./tmp/api ./cmd/api
	CGO_ENABLED=0 go build -trimpath -o ./tmp/seed ./cmd/seed

fmt:
	gofmt -w .

lint: ## gofmt + vet + golangci-lint
	@test -z "$$(gofmt -l .)" || (gofmt -l . && echo "jalankan: make fmt" && exit 1)
	go vet ./...
	golangci-lint run

test: ## unit test (test integrasi dilewati tanpa TEST_DATABASE_URL)
	go test -race -count=1 ./...

test-integration: ## unit + integrasi; DATABASE INI AKAN DIKOSONGKAN
	TEST_DATABASE_URL="$(TEST_DATABASE_URL)" go test -race -count=1 ./...

migrate-new: ## make migrate-new name=add_xxx
	@test -n "$(name)" || (echo "pakai: make migrate-new name=deskripsi_singkat" && exit 1)
	@last=$$(ls migrations/*.up.sql | sed -E 's#.*/([0-9]{6})_.*#\1#' | sort | tail -1); \
	next=$$(printf "%06d" $$((10#$$last + 1))); \
	touch migrations/$${next}_$(name).up.sql migrations/$${next}_$(name).down.sql; \
	echo "dibuat: migrations/$${next}_$(name).{up,down}.sql"

tidy:
	go mod tidy
