# release: ENV_SILENT=true node ace migration:run --force && node ace db:seed
# web: npm run start:prod
# ./build/ace

release: ENV_SILENT=true node .app/build/ace migration:run --force
web: ENV_SILENT=true node ./build/server.js