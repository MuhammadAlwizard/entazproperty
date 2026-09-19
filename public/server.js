// Entry file for the public app. The port is read from the PORT environment variable.
// Next names external packages with a build-specific hash (mysql2-<hash>) and keeps an alias for it in .next/node_modules.
// Hosts that drop node_modules folders lose that alias, so map the hashed name back to the real package here.
const Module = require('module');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolve.call(this, request.replace(/^mysql2-[0-9a-f]{16}(?=\/|$)/, 'mysql2'), ...rest);
};
require('./diag.js');
