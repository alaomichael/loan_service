# release: ENV_SILENT=true node ace migration:run --force && node ace db:seed
# web: npm run start:prod

release: ENV_SILENT=true node ./ace migration:run --force && npm install @adonisjs/assembler
web: ENV_SILENT=true node ./build/server.js