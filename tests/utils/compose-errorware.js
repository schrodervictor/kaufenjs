describe('./utils/compose-errorware.js', () => {

  var compose = rootRequire('/utils/compose-errorware');

  var err;
  beforeEach(() => err = new Error("It's a trap!"));

  var req;
  beforeEach(() => req = {calls: []});

  var res;
  beforeEach(() => res = {});

  describe('compose', () => {
    it('should compose errorwares into one errorware', (done) => {
      var errorwareOne = spy(function(err, req, res, next) {
        req.calls.push('one');
        next(err);
      });

      var errorwareTwo = spy(function(err, req, res, next) {
        req.calls.push('two');
        next(err);
      });

      var errorware = compose([errorwareOne, errorwareTwo]);

      errorware(err, req, res, function(err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(req.calls).to.have.length(2);
        expect(req.calls).to.deep.equals(['one', 'two']);
        expect(errorwareOne).to.have.been.calledOnce;
        expect(errorwareTwo).to.have.been.calledOnce;
        done();
      });
    });

    it('should return noop errorware in case of empty array', (done) => {
      var errorware = compose([]);

      errorware(err, req, res, function(err) {
        expect(err).to.be.an.instanceOf(Error);
        done();
      });
    });

    it('should run the provided errorware as many times as needed', (done) => {
      var errorwareOne = spy(function (err, req, res, next) {
        req.calls.push('one');
        next();
      });

      var errorwareTwo = spy(function (err, req, res, next) {
        req.calls.push('two');
        next();
      });

      var errorware = compose([
        errorwareOne,
        errorwareTwo,
        errorwareOne,
        errorwareTwo,
        errorwareTwo
      ]);

      errorware(err, req, res, function(err) {
        expect(req.calls).to.have.length(5);
        expect(req.calls).to.deep.equals(['one', 'two', 'one', 'two', 'two']);
        expect(errorwareOne).to.have.been.calledTwice;
        expect(errorwareTwo).to.have.been.calledThrice;
        done();
      });
    });
  });
});
