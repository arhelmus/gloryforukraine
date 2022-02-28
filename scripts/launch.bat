SET NODE_MAX_OLD_SPACE_SIZE=1400
SET PARALLEL_FACTOR=5
SET SCHEDULED_TARGETS_URL=https://gloryforukraine.pages.dev/scheduled_targets.json

node --max-old-space-size=%NODE_MAX_OLD_SPACE_SIZE% .\src\app.mjs