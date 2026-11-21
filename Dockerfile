# syntax=docker/dockerfile:1
# 하나의 Dockerfile로 서브 프로젝트마다 따로 이미지를 만든다:
#   docker build --build-arg TARGET=portal .
#   docker build --build-arg TARGET=expedition-lines .
ARG TARGET=portal

FROM node:22-alpine AS build
ARG TARGET
WORKDIR /src
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY . .
RUN --mount=type=cache,target=/root/.npm npm ci
RUN npm test && node scripts/bundle.mjs "$TARGET"

# 런타임: 번들된 서버 한 파일 + 정적 웹. node_modules 없음
FROM node:22-alpine
ARG TARGET
ENV NODE_ENV=production PORT=8080 STATIC_DIR=/app/web
WORKDIR /app
COPY --from=build /src/out/${TARGET}/server.cjs ./server.cjs
COPY --from=build /src/out/${TARGET}/web ./web
USER node
EXPOSE 8080
CMD ["node", "server.cjs"]
