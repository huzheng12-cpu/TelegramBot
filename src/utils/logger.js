const config = require('../config');

class Logger {
  constructor() {
    this.logLevel = config.app.logLevel;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  _shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  _formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (data) {
      formattedMessage += ` ${JSON.stringify(data)}`;
    }

    return formattedMessage;
  }

  error(message, data = null) {
    if (this._shouldLog('error')) {
      console.error(this._formatMessage('error', message, data));
    }
  }

  warn(message, data = null) {
    if (this._shouldLog('warn')) {
      console.warn(this._formatMessage('warn', message, data));
    }
  }

  info(message, data = null) {
    if (this._shouldLog('info')) {
      console.info(this._formatMessage('info', message, data));
    }
  }

  debug(message, data = null) {
    if (this._shouldLog('debug')) {
      console.debug(this._formatMessage('debug', message, data));
    }
  }
}

module.exports = new Logger(); 