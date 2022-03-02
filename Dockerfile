# syntax=docker/dockerfile:1
#
# ██████████████████████████████
# ██████████████░░██████████████
# ████░████████░░░░████████░████
# ████░░░██████░░░░██████░░░████
# ████░█░░░█████░░██████░░█░████
# ████░██░░█████░░█████░░██░████
# ████░███░░████░░████░░███░████
# ████░███░░████░░████░░███░████
# ████░███░░████░░████░░███░████
# ████░████░░███░░███░░████░████
# ████░████░░███░░███░░████░████
# ████░██░░░███░░░░███░░░██░████
# ████░██░░███░░██░░███░░██░████
# ████░██░░░██████████░░░██░████
# ████░████░░░░░██░░░░░████░████
# ████░█████░░██░░██░░█████░████
# ████░░░░░░░░░░░░░░░░░░░░░░████
# ██████████░░██░░██░░██████████
# ░██████████░░█░░█░░██████████
# ░░██████████░░░░░░██████████
# ░░░░█████████░░░░█████████
# ░░░░░░░░██████████████
# ░░░░░░░░░░░░░████
#

##
## Build
##
FROM --platform=linux/amd64 node:16 AS build

WORKDIR /app

COPY src src
COPY package-lock.json package-lock.json
COPY package.json package.json

RUN npm ci --prod

RUN curl https://github.com/codesenberg/bombardier/releases/download/v1.2.5/bombardier-linux-amd64 --output bin/bombardier

##
## Deploy
##
FROM --platform=linux/amd64 debian:11

WORKDIR /app

COPY --from=build /app/bin/gloryforukraine /gloryforukraine
COPY --from=build /app/bin/bombardier /bombardier

ENTRYPOINT ["/gloryforukraine"]