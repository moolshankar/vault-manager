'use strict';
const winston = require('winston');
const fs = require('fs');
const env = process.env.NODE_ENV || 'development';
const logDir = 'logs';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const tsFormat = () => (new Date()).toLocaleDateString()+' : '+(new Date()).toLocaleTimeString();


const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      filename: `${logDir}/vault_ui.log`,
      timestamp: tsFormat,
      level: env === 'development' ? 'debug' : 'info'
    })
  ]
});

module.exports = logger
