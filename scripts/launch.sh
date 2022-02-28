#!/bin/bash
NODE_MAX_OLD_SPACE_SIZE=1400

PARALLEL_FACTOR=5 \
SCHEDULED_TARGETS_URL=https://gloryforukraine.pages.dev/scheduled_targets.json \
node --max-old-space-size=$NODE_MAX_OLD_SPACE_SIZE ./src/app.mjs \
/