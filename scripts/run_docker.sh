#!/bin/bash
cd ..
docker run --rm -it $(docker build -q .)
