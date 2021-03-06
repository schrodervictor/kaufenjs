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

  var five = spy((req, res, radio) => {
    req.calls.push('five');
    radio.emit('done');
  });

  beforeEach(() => {
    [one, two, three, four, five].map(spy => spy.resetHistory());
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

    it('should break the chain when an error occurs', (done) => {
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
    });

    it('should break the chain when "done" occurs', (done) => {
      var eventware = serial([one, two, five, four, three]);

      var callback = spy(() => done('should not be called'));
      radio.on('ok', callback);
      radio.on('error', callback);

      radio.on('done', () => {
        // Wrap the assertions to get the next tick and catch eventual errors
        // (in the ideal scenario, this changes nothing)
        setTimeout(() => {
          expect(req.calls).to.have.length(3);
          expect(req.calls).to.deep.equals(['one', 'two', 'five']);

          expect(one).to.have.been.calledOnce;
          expect(two).to.have.been.calledOnce;
          expect(five).to.have.been.calledOnce;

          expect(three).to.not.have.been.called;
          expect(four).to.not.have.been.called;

          expect(callback).to.not.have.been.called;
          done();
        }, 0);
      });

      eventware(req, res, radio);
    });

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

    it('should emit "done" on the radio when "done" occurs', (done) => {
      var eventware = parallel([one, two, five, one, two]);

      var callback = spy(() => done('should not be called'));
      radio.on('ok', callback);
      radio.on('error', callback);

      radio.on('done', () => {
        // Wrap the assertions to get the next tick (so that everything has
        // time to finish)
        setTimeout(() => {
          // Being concurrent, all calls are still expected to happen.
          expect(req.calls).to.have.length(5);
          expect(req.calls).to.deep.equals(['one', 'two', 'five', 'one', 'two']);
          expect(one).to.have.been.calledTwice;
          expect(two).to.have.been.calledTwice;
          expect(five).to.have.been.calledOnce;

          // But the callback should never be invoked
          expect(callback).to.not.have.been.called;
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
  });
});
