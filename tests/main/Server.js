'use strict';

describe('./main/Server.js', () => {

  var Server = rootRequire('/main/Server');
  var API = rootRequire('/main/API');
  var EventEmitter = require('events');
  var HttpServer = require('http').Server;

  var listener;
  beforeEach(() => {
    listener = new EventEmitter();
    // The listener must have the "listen" method
    listener.listen = spy();
  });

  describe('class Server', () => {
    it('should create an new Server instance', () => {
      var server = new Server();
      expect(server).to.be.an.instanceOf(Server);
    });

    it('should create distinct instances', () => {
      var server0 = new Server();
      var server1 = new Server();
      expect(server0).to.not.equals(server1);
    });

    it('should be an EventEmitter', () => {
      var server = new Server();
      expect(server).to.be.an.instanceOf(EventEmitter);
    });
  });

  describe('constructor', () => {
    it('should take an event listener/emitter as optional argument', () => {
      var server = new Server(listener);
      expect(server.listener).to.equals(listener);
    });

    it('should create a http server when no listener is passed', () => {
      var server = new Server();
      expect(server.listener).to.be.an.instanceOf(HttpServer);
    });
  });

  describe('.run({ port })', () => {
    it('should take a port number and make the listener listen to it', () => {
      var server = new Server(listener);
      server.run({port: 3000});
      expect(listener.listen).to.have.been.calledWith(3000);
    });
  });

  describe('.attach(api)', () => {
    it('should add an API to the registered handlers', () => {
      var server = new Server(listener);
      var api = new API();
      server.attach(api);
      expect(server.handlers).to.contain(api);
    });
  });

  describe('.handleIncomingMessage(req, res)', () => {
    it('should pass the req/res objects to the registered APIs', (done) => {
      var server = new Server(listener);
      server.on('response', (res) => {
        expect(res.body).to.equals('value');
        done();
      });

      var api = new API();
      api.route('GET /cart', (argReq, argRes, radio) => {
        expect(argReq).to.equals(req);
        argRes.body = 'value';
        radio.emit('done');
      });

      server.attach(api);
      server.run({port: 3000});

      var req = {method: 'GET', url: '/cart'};
      var res = {};
      listener.emit('request', req, res);
    });
  });

});
