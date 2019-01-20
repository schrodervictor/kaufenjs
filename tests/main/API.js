'use strict';

describe('./main/API.js', () => {

  var API = rootRequire('/main/API');
  var EventEmitter = require('events');

  describe('class API', () => {

    it('should create an new API instance', () => {
      var api = new API();
      expect(api).to.be.an.instanceOf(API);
    });

    it('should be an EventEmitter', () => {
      var api = new API();
      expect(api).to.be.an.instanceOf(EventEmitter);
    });

    it('should expose method: route', () => {
      var api = new API();
      expect(api).to.have.property('route');
      expect(api.route).to.be.a('function');
    });

    it('should have a catch all handler (not found)', (done) => {
      var api = new API();
      var req = {
        method: 'GET',
        url: '/cart'
      };
      var res = {};

      api.emit('request', req, res, function() {
        expect(res.code).to.be.equal(404);
        expect(res.body).to.be.deep.equal({error: 'Not found'});
        done();
      });
    });

    describe('.route(method, pattern, middleware)', () => {

      it('should accept a method, url pattern and middleware', (done) => {
        var api = new API();
        var req = {
          method: 'GET',
          url: '/cart'
        };
        var res = {};

        var middleware = spy((req, res, next) => next());

        api.route('GET', '/cart', middleware);

        api.emit('request', req, res, () => {
          expect(middleware).to.have.been.calledOnce;
          done();
        });
      });

      it('should accept regular expressions for the url pattern', (done) => {
        var api = new API();
        var req = {
          method: 'GET',
          url: '/cart'
        };
        var res = {};

        var middleware = spy((req, res, next) => next());

        api.route('GET', '~/c..t', middleware);

        api.emit('request', req, res, () => {
          expect(middleware).to.have.been.calledOnce;
          done();
        });
      });

      it('should anchor all regular expressions patterns', (done) => {
        var api = new API();
        var req = {
          method: 'GET',
          url: '/cart'
        };
        var res = {};

        var middleware = spy((req, res, next) => next());

        api.route('GET', '~art', middleware);

        api.emit('request', req, res, () => {
          expect(middleware).to.not.have.been.called;
          done();
        });
      });

      it('should give precedence to exact match', (done) => {
        var api = new API();
        var req = {
          method: 'GET',
          url: '/cart'
        };
        var res = {};

        var middlewareOne = spy((req, res, next) => next());
        var middlewareTwo = spy((req, res, next) => next());
        var middlewareThree = spy((req, res, next) => next());

        api.route('GET', '~/c..t', middlewareOne);
        api.route('GET', '/cart', middlewareTwo);
        api.route('GET', '~/.*', middlewareThree);

        api.emit('request', req, res, function() {
          expect(middlewareOne).to.not.have.been.called;
          expect(middlewareTwo).to.have.been.calledOnce;
          expect(middlewareThree).to.not.have.been.called;
          done();
        });
      });
    });
  });
});
