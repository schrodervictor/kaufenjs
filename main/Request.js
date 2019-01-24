'use strict';

var url = require('url');
var EventEmitter = require('events');


class Request extends EventEmitter {

  /**
   * @emits Request#ready
   */
  constructor(request) {
    super()
    this.originalReq = request;
    this.parse(() => this.notifyReadyState());
  }

  /**
   * @private
   */
  notifyReadyState() {
    this.emit('ready');
    this.on('newListener', (eventName, listener) => {
      // Avoid calling the same listener twice
      if (this.listeners('ready').includes(listener)) return;

      // Notify the ones that are late to the game
      if ('ready' === eventName) listener();
    });
  }

  /**
   * @private
   */
  parse(callback) {
    var parsedUrl = url.parse(this.originalReq.url, true);
    var qs = parsedUrl.query;
    for (let key in qs) {
      let value = qs[key];

      // Support to boolean flags: /path?flagOne&flagTwo
      if (value === '') qs[key] = true;

      // Support to arrays with brackets: /path?arr[]=0&arr[]=1
      if (key.endsWith('[]')) {
        delete qs[key];
        if (!(value instanceof Array)) value = [value];
        key = key.slice(0, -2);
        qs[key] = value;
      }

      // Support to dot notation: /path?obj.key0.key1=value1
      if (key.indexOf('.') >= 0) {
        delete qs[key];
        this.addDotQS(qs, key, value);
      }
    }
    this.path = parsedUrl.pathname;
    this.qs = qs;

    this.parseBody(callback);
  }

  /**
   * @private
   */
  addDotQS(obj, key, value) {
    var dotIndex = key.indexOf('.');
    if (dotIndex === -1) return obj[key] = value;

    var head = key.slice(0, dotIndex);
    var tail = key.slice(dotIndex + 1);

    if (!(head in obj)) obj[head] = {};
    this.addDotQS(obj[head], tail, value);
  }

  /**
   * @private
   */
  parseBody(callback) {
    var stream = this.originalReq;
    var chunks = [];
    stream.on('data', (buffer) => chunks.push(buffer));
    stream.on('end', () => {
      this.rawBody = Buffer.concat(chunks).toString();
      try {
        this.body = JSON.parse(this.rawBody);
      } catch(error) {
        this.body = null;
        this.error = 'invalid-json-body';
      }
      return callback();
    });
  }
}

module.exports = Request;
