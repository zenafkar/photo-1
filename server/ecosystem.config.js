const path = require('node:path');

// This file is consumed by PM2 from both the deploy script and systemd.
// Keep application paths absolute so a different cwd cannot start an
// unexpected copy of the API.
const appRoot = '/var/www/zen-dev/server';
const nodeBinary = process.env.NODE_BIN || '/usr/bin/node';
const pm2LogRoot = process.env.PM2_LOG_ROOT || '/var/lib/zen-deploy/pm2';

module.exports = {
  apps: [{
    name: 'backend-api',
    script: path.join(appRoot, 'dist/index.js'),
    cwd: appRoot,
    interpreter: nodeBinary,
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    kill_timeout: 15000,
    listen_timeout: 10000,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    exp_backoff_restart_delay: 100,
    merge_logs: true,
    time: true,
    out_file: path.join(pm2LogRoot, 'backend-api.out.log'),
    error_file: path.join(pm2LogRoot, 'backend-api.error.log'),
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
