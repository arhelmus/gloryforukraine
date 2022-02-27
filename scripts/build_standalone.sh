#!/bin/bash
cd ..

rm -rf out

env GOOS=windows GOARCH=386 go build -o out/win/gloryforukraine.exe .
cp bin/win/bombardier.exe out/win/bombardier.exe

env GOOS=linux GOARCH=386 go build -o out/linux/gloryforukraine .
cp bin/linux/bombardier out/linux/bombardier

env GOOS=darwin GOARCH=amd64 go build -o out/mac/gloryforukraine .
cp bin/mac/bombardier out/mac/bombardier

cp scripts/launchers/launch.sh out/launch.sh
cp scripts/launchers/launch.bat out/launch.bat

cd out
zip -r gloryforukraine.zip *
