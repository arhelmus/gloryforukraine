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
FROM --platform=linux/amd64 golang:1.16-buster AS build

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY *.go ./

RUN go build -o /gloryforukraine

##
## Deploy
##
FROM --platform=linux/amd64 gcr.io/distroless/base-debian10

WORKDIR /

COPY --from=build /gloryforukraine /gloryforukraine

USER nonroot:nonroot

COPY bin/linux/bombardier /bin/linux/bombardier
COPY bin/mac/bombardier /bin/mac/bombardier
COPY bin/win/bombardier.exe /bin/win/bombardier.exe

ENTRYPOINT ["/gloryforukraine"]
