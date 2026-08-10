const path = require('node:path');

// Development-only PM2 contract. The target root and port are supplied by the
// deployment environment; silently defaulting to production is prohibited.
const appRoot = process.env.ZEN_DEV_APP_ROOT;
const port = process.env.ZEN_DEV_PORT;
if (!appRoot || !port) throw new Error('ZEN_DEV_APP_ROOT and ZEN_DEV_PORT are required');
const allowedRoot = process.env.ZEN_DEV_ALLOWED_ROOT || '/var/www/zen-dev/server';
const numericPort = Number(port);
if (appRoot !== allowedRoot || !/^\/var\/www\/zen-dev\/server$/.test(appRoot)) {
  throw new Error('ZEN_DEV_APP_ROOT is outside the explicit development target');
}
if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
  throw new Error('ZEN_DEV_PORT must be an integer between 1 and 65535');
}
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
  throw new Error('NODE_ENV must remain development');
}

module.exports = {
  apps: [{
    name: 'backend-api-dev',
    script: path.join(appRoot, 'dist/index.js'),
    cwd: appRoot,
    interpreter: process.env.NODE_BIN || '/usr/bin/node',
    exec_mode: 'fork',
    instances: 1,
    watch: false,
    autorestart: true,
    env: { NODE_ENV: 'development', PORT: numericPort, ZEN_DEV_APP_ROOT: appRoot, ZEN_DEV_PORT: String(numericPort) }
  }]
};
