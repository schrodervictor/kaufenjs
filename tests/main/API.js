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
  });

  describe('catch all handler', () => {
    it('should have a catch all handler (not found)', (done) => {
      var api = new API();
      var req = {method: 'GET', url: '/cart'};
      var res = {};

      api.emit('request', req, res, () => {
        expect(res.code).to.be.equal(404);
        expect(res.body).to.be.deep.equal({error: 'Not found'});
        done();
      });
    });
  });

  describe('.route(requestSpecs, eventware)', () => {
    it('should accept a string as requestSpecs and an eventware', (done) => {
      var api = new API();
      var req = {method: 'GET', url: '/cart'};
      var res = {};

      var eventware = spy((req, res, radio) => {
        expect(eventware).to.have.been.calledOnce;
        done();
      });

      api.route('GET /cart', eventware);
      api.emit('request', req, res);
    });

    it('should accept regular expressions for the url pattern', (done) => {
      var api = new API();
      var req = {method: 'GET', url: '/cart'};
      var res = {};

      var eventware = spy((req, res, radio) => {
        expect(eventware).to.have.been.calledOnce;
        done();
      });

      api.route('GET ~/c..t', eventware);
      api.emit('request', req, res);
    });

    it('should anchor all regular expressions patterns', (done) => {
      var api = new API();
      var req = {method: 'GET', url: '/cart'};
      var res = {};

      var eventware = spy((req, res, radio) => radio.emit('error'));

      api.route('GET ~art', eventware);
      api.emit('request', req, res, () => {
        expect(eventware).to.not.have.been.called;
        done();
      });
    });

    it('should give precedence to exact match', (done) => {
      var api = new API();
      var req = {method: 'GET', url: '/cart'};
      var res = {};

      var eventwareOne = spy((req, res, radio) => radio.emit('ok'));
      var eventwareTwo = spy((req, res, radio) => radio.emit('ok'));
      var eventwareThree = spy((req, res, radio) => radio.emit('ok'));

      api.route('GET ~/c..t', eventwareOne);
      api.route('GET /cart', eventwareTwo);
      api.route('GET ~/.*', eventwareThree);

      api.emit('request', req, res, () => {
        expect(eventwareOne).to.not.have.been.called;
        expect(eventwareTwo).to.have.been.calledOnce;
        expect(eventwareThree).to.not.have.been.called;
        done();
      });
    });
  });
});
