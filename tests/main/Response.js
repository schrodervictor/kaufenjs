'use strict';

describe('./main/Response.js', () => {
  var Response = rootRequire('/main/Response');
  var EventEmitter = require('events');

  describe('class Request', () => {
    it('should create Response instances', () => {
      var response0 = new Response();
      var response1 = new Response();
      expect(response0).to.be.instanceOf(Response);
      expect(response1).to.be.instanceOf(Response);
      expect(response0).to.not.be.equal(response1);
    });

    it('should be an EventEmitter', () => {
      expect(new Response()).to.be.instanceOf(EventEmitter);
    });
  });
});
