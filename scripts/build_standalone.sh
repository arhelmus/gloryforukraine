#!/bin/bash
cd ..
env GOOS=windows GOARCH=386 go build -o out/win/gloryforukraine.exe .
cp bin/win/bombardier.exe out/win/bombardier.exe

env GOOS=linux GOARCH=386 go build -o out/linux/gloryforukraine .
cp bin/linux/bombardier out/linux/bombardier

env GOOS=darwin GOARCH=amd64 go build -o out/mac/gloryforukraine .
cp bin/mac/bombardier out/mac/bombardier
