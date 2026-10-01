// Entry point of the "backend" service on Vercel (see the repository's vercel.json): the whole
// Express API runs as one function. It loads the app compiled by `npm run vercel-build` into lib/,
// where the `@/` aliases are already resolved.
//
// The compiled code goes to lib/ rather than dist/: when a build command runs, Vercel's Node
// builder looks for app/index/server files in dist/ and would take lib/app.js (the App class, not
// a server) as the function.
require('reflect-metadata');
const { ValidateEnv } = require('./lib/utils/validateEnv');
const { App } = require('./lib/app');
const AppRoutes = require('./lib/routes').default;

ValidateEnv();

module.exports = new App(AppRoutes).getServer();
