describe('./utils/compose-middleware.js', () => {

  var compose = rootRequire('/utils/compose-middleware');

  var req;
  beforeEach(() => req = {calls: [], check: true});

  var res;
  beforeEach(() => res = {});

  describe('compose', () => {
    it('should compose middlewares into one middleware', (done) => {
      var middlewareOne = spy(function (req, res, next) {
        req.calls.push('one');
        next();
      });

      var middlewareTwo = spy(function (req, res, next) {
        req.calls.push('two');
        next();
      });

      var middleware = compose([middlewareOne, middlewareTwo]);

      middleware(req, res, function() {
        expect(req.calls).to.have.length(2);
        expect(req.calls).to.deep.equals(['one', 'two']);
        expect(middlewareOne).to.have.been.calledOnce;
        expect(middlewareTwo).to.have.been.calledOnce;
        done();
      });
    });

    it('should return noop middleware in case of empty array', (done) => {
      var middleware = compose([]);

      middleware(req, res, function() {
        // We need at least one assertion here to detect potential failures
        expect(req.check).to.be.true;
        done();
      });
    });

    it('should run the provided middleware as many times as needed', (done) => {
      var middlewareOne = spy(function (req, res, next) {
        req.calls.push('one');
        next();
      });

      var middlewareTwo = spy(function (req, res, next) {
        req.calls.push('two');
        next();
      });

      var middleware = compose([
        middlewareOne,
        middlewareTwo,
        middlewareOne,
        middlewareTwo,
        middlewareTwo
      ]);

      middleware(req, res, function() {
        expect(req.calls).to.have.length(5);
        expect(req.calls).to.deep.equals(['one', 'two', 'one', 'two', 'two']);
        expect(middlewareOne).to.have.been.calledTwice;
        expect(middlewareTwo).to.have.been.calledThrice;
        done();
      });
    });

    it('should call next(err) when an error occurs', (done) => {
      var middlewareOne = spy(function (req, res, next) {
        req.calls.push('one');
        next();
      });

      var middlewareTwo = spy(function (req, res, next) {
        req.calls.push('two');
        next(new Error('He is dead, Jim'));
      });

      var middleware = compose([
        middlewareOne,
        middlewareTwo,
        middlewareOne,
        middlewareTwo
      ]);

      middleware(req, res, function(err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(req.calls).to.have.length(2);
        expect(req.calls).to.deep.equals(['one', 'two']);
        expect(middlewareOne).to.have.been.calledOnce;
        expect(middlewareTwo).to.have.been.calledOnce;
        done();
      });
    });
  });
});
