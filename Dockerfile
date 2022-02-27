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
FROM golang:1.16-buster AS build

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
COPY bin/**/* ./
RUN go mod download

COPY *.go ./

RUN go build -o /gloryforukraine

##
## Deploy
##
FROM gcr.io/distroless/base-debian10

WORKDIR /

COPY --from=build /gloryforukraine /gloryforukraine

USER nonroot:nonroot

ENTRYPOINT ["/gloryforukraine"]
