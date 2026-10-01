// Vercel entry point: a single serverless function serving the whole Express API.
// It loads the compiled app from dist/ (built by `npm run vercel-build`), where the `@/` aliases
// are already resolved.
require('reflect-metadata');
const { ValidateEnv } = require('../dist/utils/validateEnv');
const { App } = require('../dist/app');
const AppRoutes = require('../dist/routes').default;

ValidateEnv();

module.exports = new App(AppRoutes).getServer();
