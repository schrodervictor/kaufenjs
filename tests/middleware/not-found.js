describe('./middleware/not-found.js', () => {
  var middleware = rootRequire('/middleware/not-found');

  var req;
  beforeEach(() => req = {});

  var res;
  beforeEach(() => res = {});

  it('should set status code (404) and response body', (done) => {
    middleware(req, res, function() {
      expect(res.code).to.equals(404);
      expect(res.body).to.deep.equals({error: 'Not found'});
      done();
    });
  });
});
