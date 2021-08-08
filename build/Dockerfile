FROM node:alpine AS builder

RUN apk update && apk add --no-cache \
    build-base \
    jq \
    zip \
    git; \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY release.sh .
COPY possum.pem .

RUN ./release.sh

FROM scratch AS releaser

COPY --from=builder /app/privacypossum/possum.zip /
