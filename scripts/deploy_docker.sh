#!/bin/bash
cd ..
docker build -t archdev/gloryforukraine:latest . && docker push archdev/gloryforukraine:latest
