'use strict';

describe('./main/Request.js', () => {
  var Request = rootRequire('/main/Request');
  var EventEmitter = require('events');
  var IncomingMessage = require('http').IncomingMessage;
  var Socket = require('net').Socket

  var req;
  beforeEach(() => req = new IncomingMessage(new Socket()));

  describe('class Request', () => {
    it('should create Request instances', () => {
      var request = new Request(req);
      expect(request).to.be.an.instanceOf(Request);
    });

    it('should be an EventEmitter', () => {
      var request = new Request(req);
      expect(request).to.be.an.instanceOf(EventEmitter);
    });

    it('should store a reference to the original IncomingMessage', () => {
      var request = new Request(req);
      expect(request.originalReq).to.be.an.instanceOf(IncomingMessage);
    });

    describe('event: "ready"', () => {
      it('triggers the event when request ended', (done) => {
        var callback = spy(() => {
          expect(callback).to.have.been.calledOnce;
          done();
        });

        req.url = '/the/full/path?key=value';
        var request = new Request(req);
        request.on('ready', callback);
        req.emit('end');
      });

      it('re-triggers event, if subscriber is late', (done) => {
        var callback = spy(() => {
          expect(callback).to.have.been.calledOnce;
          done();
        });

        req.url = '/the/full/path?key=value';
        var request = new Request(req);
        request.on('ready', callback);
        req.emit('end');
      });

      it('re-triggers event multiple times, if needed', (done) => {
        var count = 3;
        var callback1 = spy(() => {
          expect(callback1).to.have.been.calledOnce;
          if (!--count) done();
        });
        var callback2 = spy(() => {
          expect(callback2).to.have.been.calledOnce;
          if (!--count) done();
        });
        var callback3 = spy(() => {
          expect(callback3).to.have.been.calledOnce;
          if (!--count) done();
        });

        req.url = '/the/full/path?key=value';
        var request = new Request(req);
        request.on('ready', callback1);
        req.emit('end');
        request.on('ready', callback2);
        request.on('ready', callback3);
      });

      it('triggers only once, even if subscribed multiple times', (done) => {
        var callback = spy();

        req.url = '/the/full/path?key=value';
        var request = new Request(req);
        request.on('ready', callback);
        req.emit('end');
        request.on('ready', callback);
        request.on('ready', callback);

        // I hate time dependencies on tests, but here we have to make sure no
        // other calls happen after the first one. If we use a counter like it
        // was done on the previous test, the test would actually never finish
        // if the implementation is correct (the counter would be decremented
        // only once...). If not counting and asserting directly, we would
        // actually be asserting on the first pass of the function getting
        // false positives, even if the function gets called more times.
        //
        // As we are not executing anything else, the event loop is really
        // fast. 10 milliseconds is something that we won't feel at all and
        // will cover the hypothesis of later calls.
        setTimeout(() => {
          expect(callback).to.have.been.calledOnce;
          done();
        }, 10);
      });
    });

    // .path is populated synchronously
    describe('.path', () => {
      it('should hold the path without query string', () => {
        req.url = '/the/full/path?key=value';
        var request = new Request(req);
        expect(request.path).to.be.equals('/the/full/path');
      });

      it('should hold the path without fragment string', () => {
        req.url = '/the/full/path#key=value';
        var request = new Request(req);
        expect(request.path).to.be.equals('/the/full/path');
      });
    });

    // .qs is populated synchronously
    describe('.qs', () => {
      it('should hold an object with all key value pairs', () => {
        req.url = '/the/full/path?key0=value0&key1=value1';
        var request = new Request(req);
        expect(request.qs).to.deep.equals({
          key0: 'value0',
          key1: 'value1'
        });
      });

      it('should support boolean flags', () => {
        req.url = '/the/full/path?isSomething&isAnotherThing&key=42';
        var request = new Request(req);
        expect(request.qs).to.deep.equals({
          key: '42',
          isSomething: true,
          isAnotherThing: true,
        });
      });

      it('should support arrays without brackets', () => {
        req.url = '/the/full/path?arr=value0&arr=value1';
        var request = new Request(req);
        expect(request.qs).to.deep.equals({
          arr: ['value0', 'value1'],
        });
      });

      it('should support arrays with brackets', () => {
        req.url = '/the/full/path?arr[]=value0&arr[]=value1';
        var request = new Request(req);
        expect(request.qs).to.deep.equals({
          arr: ['value0', 'value1'],
        });
      });

      it('should support single element arrays with brackets', () => {
        req.url = '/the/full/path?arr[]=value';
        var request = new Request(req);
        expect(request.qs).to.deep.equals({
          arr: ['value'],
        });
      });

      it('should support dot notation', () => {
        req.url = '/the/full/path?obj.key0.key1=value1&obj.key2=value2';
        var request = new Request(req);
        expect(request.qs).to.deep.equals({
          obj: {key0: {key1: 'value1'}, key2: 'value2'}
        });
      });

      it('should support nested arrays', () => {
        req.url = '/the/full/path?obj.key=value0&obj.key=value1';
        var request = new Request(req);
        expect(request.qs).to.deep.equals({
          obj: {key: ['value0', 'value1']}
        });
      });

      it('should support nested arrays (with brackets)', () => {
        req.url = '/the/full/path?obj.key[]=value0&obj.key[]=value1';
        var request = new Request(req);
        expect(request.qs).to.deep.equals({
          obj: {key: ['value0', 'value1']}
        });
      });
    });

    // .rawBody is populated asynchronously (listen to 'ready' event)
    describe('.rawBody', () => {
      it('should hold the raw body', (done) => {
        req.url = '/whatever';
        var request = new Request(req);
        request.parseBody(function() {
          expect(request.rawBody).to.equals('raw-body-string');
          done();
        });
        req.emit('data', Buffer.from('raw-'));
        req.emit('data', Buffer.from('body-'));
        req.emit('data', Buffer.from('string'));
        req.emit('end');
      });
    });

    // .body is populated asynchronously (listen to 'ready' event)
    describe('.body', () => {
      it('should hold the JSON decoded body', (done) => {
        req.url = '/whatever';
        var request = new Request(req);
        request.on('ready', function() {
          expect(request.body).to.deep.equals({key: 'value'});
          done();
        });
        req.emit('data', Buffer.from('{"key":"v'));
        req.emit('data', Buffer.from('alue"}'));
        req.emit('end');
      });
    });

    // .error is populated asynchronously (listen to 'ready' event)
    describe('.error', () => {
      it('should be set if JSON body is invalid', (done) => {
        req.url = '/whatever';
        var request = new Request(req);
        request.on('ready', function() {
          expect(request.body).to.be.null;
          expect(request.error).to.equals('invalid-json-body');
          done();
        });
        req.emit('data', Buffer.from('{"key":"v'));
        req.emit('end');
      });
    });
  });
});
