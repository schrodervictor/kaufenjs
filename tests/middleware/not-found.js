'use strict';

describe('./eventware/not-found.js', () => {
  var EventEmitter = require('events');
  var eventware = rootRequire('/eventware/not-found');

  var req;
  beforeEach(() => req = {});

  var res;
  beforeEach(() => res = {});

  var radio;
  beforeEach(() => radio = new EventEmitter());

  it('should set status code (404) and response body', (done) => {
    radio
      .on('ok', () => {
        expect(res.code).to.equals(404);
        expect(res.body).to.deep.equals({error: 'Not found'});
        done();
      })
      .on('error', () => done('this should not happen'));

    eventware(req, res, radio);
  });
});
