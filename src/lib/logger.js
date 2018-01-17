import log4js from 'log4js';

class Logger {
  constructor () {
    log4js.configure({
      appenders: {
        multi: { type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log' }
      },
      categories: {
        default: { appenders: [ 'multi' ], level: 'debug' }
      },
      pm2: true
    });
  }
  
  getLogger(fileName) {
    return log4js.getLogger(fileName);
  }
}

module.exports = new Logger();
