# syntax=docker/dockerfile:1.7
# Backend MasterPro (PRD §15.2). Target: dev (hot reload), runner (produksi, distroless).
FROM golang:1.26-alpine AS base
WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

FROM base AS dev
RUN --mount=type=cache,target=/go/pkg/mod go install github.com/air-verse/air@v1.67.4
COPY . .
EXPOSE 8080
CMD ["air", "-c", ".air.toml"]

FROM base AS builder
ARG GIT_SHA=dev
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w -X main.version=${GIT_SHA}" -o /out/api ./cmd/api \
 && CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/seed ./cmd/seed

FROM gcr.io/distroless/static-debian12:nonroot AS runner
WORKDIR /app
COPY --from=builder /out/api /app/api
COPY --from=builder /out/seed /app/seed
USER nonroot:nonroot
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["/app/api", "healthcheck"]
ENTRYPOINT ["/app/api"]
