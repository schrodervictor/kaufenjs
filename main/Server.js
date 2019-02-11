'use strict';

var http = require('http');
var EventEmitter = require('events');
var serial = require('../utils/compose-eventware').serial;

class Server extends EventEmitter {

  /**
   * @arg {EventEmitter} [listener] - The event listener to which this server
   * will be connected to. If not provided, a new HTTP server will be created.
   */
  constructor(listener) {
    super();
    this.handlers = [];
    if (!listener) listener = http.createServer();
    this.listener = listener;
  }

  /**
   * Default eventware for this server. This is supposed to be dynamically
   * overriden when new APIs are attached. See .attach(api) method bellow.
   *
   * @arg req {IncomingMessage} - Request
   * @arg res {ServerResponse} - Response
   * @arg radio {EventEmitter} - The Radio
   */
  eventware(req, res, radio) {
    radio.emit('ok');
  }

  /**
   * Default callback to the "listening" callback. Can be overriden by simply
   * attaching a new callback to the "listening" event on the server level.
   */
  listening(port) {
    console.log(`server listening to port [${port}]`);
  }

  /**
   * @arg {API} api - An API instance to attach to this server. It will
   * receive all request events with req, res, radio. The first API to emit an
   * 'done' event on the radio, breaks the chain and terminates the request.
   */
  attach(api) {
    this.handlers.push(api);
    this.eventware = serial(this.handlers.map(api => api.asEventware()));
  }

  /**
   * @private
   */
  handleIncomingMessage(req, res) {
    var radio = new EventEmitter();
    var respond = (err) => {
      if (err) console.error(err);
      this.emit('response', res) || this.sendResponse(res);
    };
    radio.on('ok', respond);
    radio.on('done', respond);
    radio.on('error', respond);

    this.eventware(req, res, radio);
  }

  /**
   * Default handler to 'response' event. Can be overriden by attaching
   * a new handler to that event on the server level.
   */
  sendResponse(res) {
    console.log('response: ', res);
  }

  run({ port }) {
    this.listener.on('listening', () => {
      this.emit('listening', port) || this.listening(port);
    });
    this.listener.on('request', (req, res) => {
      this.handleIncomingMessage(req, res);
    });
    this.listener.listen(port);
  }
}

module.exports = Server;
