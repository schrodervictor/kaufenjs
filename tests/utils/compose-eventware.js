describe('./utils/compose-eventware.js', () => {
  var EventEmitter = require('events');

  var parallel = rootRequire('/utils/compose-eventware').parallel;
  var serial = rootRequire('/utils/compose-eventware').serial;

  var req;
  beforeEach(() => req = {calls: [], check: true});

  var res;
  beforeEach(() => res = {});

  var radio;
  beforeEach(() => radio = new EventEmitter());

  var one = spy((req, res, radio) => {
    req.calls.push('one');
    radio.emit('ok');
  });

  var two = spy((req, res, radio) => {
    req.calls.push('two');
    radio.emit('ok');
  });

  var three = spy((req, res, radio) => {
    req.calls.push('three');
    radio.emit('error', new Error('He is dead, Jim'));
  });

  var four = spy((req, res, radio) => {
    setTimeout(() => req.calls.push('four') && radio.emit('ok'), 10);
  });

  var oneNext = spy((req, res, next) => {
    req.calls.push('one');
    next();
  });

  var twoNext = spy((req, res, next) => {
    req.calls.push('two');
    next();
  });

  var threeNext = spy((req, res, next) => {
    req.calls.push('three');
    next(new Error('Resistance is futile!'));
  });

  beforeEach(() => {
    one.resetHistory();
    two.resetHistory();
    three.resetHistory();
    four.resetHistory();
    oneNext.resetHistory();
    twoNext.resetHistory();
    threeNext.resetHistory();
  });


  describe('serial', () => {
    it('should compose eventwares into one eventware', (done) => {
      var eventware = serial([one, two]);

      radio.on('ok', function() {
        expect(req.calls).to.have.length(2);
        expect(req.calls).to.deep.equals(['one', 'two']);
        expect(one).to.have.been.calledOnce;
        expect(two).to.have.been.calledOnce;
        done();
      });

      eventware(req, res, radio);
    });

    it('should return noop eventware in case of empty array', (done) => {
      var eventware = serial([]);

      radio.on('ok', function() {
        // We need at least one assertion here to detect potential failures
        expect(req.check).to.be.true;
        done();
      });

      eventware(req, res, radio);
    });

    it('should run the provided eventware as many times as needed', (done) => {
      var eventware = serial([one, two, one, two, two]);

      radio.on('ok', function() {
        expect(req.calls).to.have.length(5);
        expect(req.calls).to.deep.equals(['one', 'two', 'one', 'two', 'two']);
        expect(one).to.have.been.calledTwice;
        expect(two).to.have.been.calledThrice;
        done();
      });

      eventware(req, res, radio);
    });

    it(
      'should emit "error" and break the chain when an error occurs',
      (done) => {
        var eventware = serial([one, three, one, three]);

        var successCallback = spy(() => done('should not be called'));
        radio.on('ok', successCallback);

        radio.on('error', (err) => {
          // Wrap the assertions to get the next tick and catch eventual errors
          // (in the ideal scenario, this changes nothing)
          setTimeout(() => {
            expect(req.calls).to.have.length(2);
            expect(req.calls).to.deep.equals(['one', 'three']);
            expect(one).to.have.been.calledOnce;
            expect(three).to.have.been.calledOnce;

            expect(err).to.be.an.instanceOf(Error);
            expect(successCallback).to.not.have.been.called;
            done();
          }, 0);
        });

        eventware(req, res, radio);
      }
    );

    it('should return a reusable eventware', (done) => {
      var eventware = serial([one, two]);

      var count = 2;

      radio.on('ok', () => {
        if (--count) return;
        expect(req.calls).to.have.length(4);
        expect(req.calls).to.deep.equals(['one', 'two', 'one', 'two']);
        expect(one).to.have.been.calledTwice;
        expect(two).to.have.been.calledTwice;
        done();
      });

      eventware(req, res, radio);
      eventware(req, res, radio);
    });


    it('should execute the eventware in order', (done) => {
      var eventware = serial([one, four, two]);

      radio.on('ok', () => {
        expect(req.calls).to.have.length(3);
        expect(req.calls).to.deep.equals(['one', 'four', 'two']);
        expect(one).to.have.been.calledOnce;
        expect(two).to.have.been.calledOnce;
        expect(four).to.have.been.calledOnce;
        done();
      });

      eventware(req, res, radio);
    });

    it('should also work with middlewares', (done) => {
      var eventware = serial([oneNext, twoNext]);

      radio.on('ok', function() {
        expect(req.calls).to.have.length(2);
        expect(req.calls).to.deep.equals(['one', 'two']);
        expect(oneNext).to.have.been.calledOnce;
        expect(twoNext).to.have.been.calledOnce;
        done();
      });

      eventware(req, res, radio);
    });

    it('should also work with middlewares (error case)', (done) => {
      var eventware = serial([oneNext, threeNext, oneNext, threeNext]);

      var successCallback = spy(() => done('should not be called'));

      radio.on('ok', successCallback);

      radio.on('error', (err) => {
        // Wrap the assertions to get the next tick and catch eventual errors
        // (in the ideal scenario, this changes nothing)
        setTimeout(() => {
          expect(req.calls).to.have.length(2);
          expect(req.calls).to.deep.equals(['one', 'three']);
          expect(oneNext).to.have.been.calledOnce;
          expect(threeNext).to.have.been.calledOnce;
          expect(err).to.be.an.instanceOf(Error);
          expect(successCallback).to.not.have.been.called;
          done();
        }, 0);
      });

      eventware(req, res, radio);
    });
  });

  describe('parallel', () => {
    it('should compose eventwares into one eventware', (done) => {
      var eventware = parallel([one, two]);

      radio.on('ok', function() {
        expect(req.calls).to.have.length(2);
        expect(req.calls).to.deep.equals(['one', 'two']);
        expect(one).to.have.been.calledOnce;
        expect(two).to.have.been.calledOnce;
        done();
      });

      eventware(req, res, radio);
    });

    it('should return noop eventware in case of empty array', (done) => {
      var eventware = parallel([]);

      radio.on('ok', function() {
        // We need at least one assertion here to detect potential failures
        expect(req.check).to.be.true;
        done();
      });

      eventware(req, res, radio);
    });

    it('should run the provided eventware as many times as needed', (done) => {
      var eventware = parallel([one, two, one, two, two]);

      radio.on('ok', function() {
        expect(req.calls).to.have.length(5);
        expect(req.calls).to.deep.equals(['one', 'two', 'one', 'two', 'two']);
        expect(one).to.have.been.calledTwice;
        expect(two).to.have.been.calledThrice;
        done();
      });

      eventware(req, res, radio);
    });

    it('should not care about the order', (done) => {
      var eventware = parallel([one, four, two]);

      radio.on('ok', function() {
        expect(req.calls).to.have.length(3);
        expect(req.calls).to.deep.equals(['one', 'two', 'four']);
        expect(one).to.have.been.calledOnce;
        expect(two).to.have.been.calledOnce;
        expect(four).to.have.been.calledOnce;
        done();
      });

      eventware(req, res, radio);
    });

    it('should emit "error" on the radio when an error occurs', (done) => {
      var eventware = parallel([one, three, one, three]);

      var successCallback = spy(() => done('should not be called'));
      radio.on('ok', successCallback);

      radio.on('error', (err) => {
        // Wrap the assertions to get the next tick (so that everything has
        // time to finish)
        setTimeout(() => {
          // Being concurrent, all calls are still expected to happen.
          expect(req.calls).to.have.length(4);
          expect(req.calls).to.deep.equals(['one', 'three', 'one', 'three']);
          expect(one).to.have.been.calledTwice;
          expect(three).to.have.been.calledTwice;

          // But the success callback should never be invoked
          expect(err).to.be.an.instanceOf(Error);
          expect(successCallback).to.not.have.been.called;
          done();
        }, 0);
      });

      eventware(req, res, radio);
    });

    it('should return a reusable eventware', (done) => {
      var eventware = parallel([one, two]);

      var count = 2;

      radio.on('ok', () => {
        if (--count) return;
        expect(req.calls).to.have.length(4);
        expect(req.calls).to.deep.equals(['one', 'two', 'one', 'two']);
        expect(one).to.have.been.calledTwice;
        expect(two).to.have.been.calledTwice;
        done();
      });

      eventware(req, res, radio);
      eventware(req, res, radio);
    });

    it('should also work with middlewares', (done) => {
      var eventware = parallel([oneNext, twoNext]);

      radio.on('ok', function() {
        expect(req.calls).to.have.length(2);
        expect(req.calls).to.deep.equals(['one', 'two']);
        expect(oneNext).to.have.been.calledOnce;
        expect(twoNext).to.have.been.calledOnce;
        done();
      });

      eventware(req, res, radio);
    });

    it('should also work with middlewares (error case)', (done) => {
      var eventware = parallel([oneNext, threeNext, oneNext, threeNext]);

      var successCallback = spy(() => done('should not be called'));

      radio.on('ok', successCallback);

      radio.on('error', (err) => {
        // Wrap the assertions to get the next tick (so that everything has
        // time to finish)
        setTimeout(() => {
          // Being concurrent, all calls are still expected to happen.
          expect(req.calls).to.have.length(4);
          expect(req.calls).to.deep.equals(['one', 'three', 'one', 'three']);
          expect(oneNext).to.have.been.calledTwice;
          expect(threeNext).to.have.been.calledTwice;

          // But the success callback should never be invoked
          expect(err).to.be.an.instanceOf(Error);
          expect(successCallback).to.not.have.been.called;
          done();
        }, 0);
      });

      eventware(req, res, radio);
    });
  });
});
