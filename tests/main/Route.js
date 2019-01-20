describe('./main/Route.js', () => {

  var Route = rootRequire('/main/Route');

  describe('class Route', () => {
    it('should create an Route instance', () => {
      var route = new Route();
      expect(route).to.be.an.instanceOf(Route);
    });

    it('should take method and pattern params', () => {
      var route = new Route('GET', '/dont/blink');
      expect(route.method).to.equals('GET');
      expect(route.pattern).to.equals('/dont/blink');
    });

    it('should expose match(method, path) method', () => {
      var route = new Route();
      expect(route.match).to.be.a('function');
    });

    describe('.match(method, path)', () => {
      describe('with exact pattern', () => {

        var route = new Route('GET', '/trust/no/one');

        it('should return true if the method/path matches', () => {
          var result = route.match('GET', '/trust/no/one');
          expect(result).to.be.true;
        });

        it("should return false if the method doesn't match", () => {
          var result = route.match('POST', '/trust/no/one');
          expect(result).to.be.false;
        });

        it("should return false if the path doesn't match", () => {
          var result = route.match('GET', '/trust/everyone');
          expect(result).to.be.false;
        });

        it("should return false if the path doesn't match exactly", () => {
          var result = route.match('GET', '/trust/no/one/really');
          expect(result).to.be.false;
        });
      });

      describe('with RegExp pattern', () => {

        var route = new Route('GET', '~ /the/[^/]{5}/is-out-there');

        it('should return true if the method/path matches', () => {
          var result = route.match('GET', '/the/truth/is-out-there');
          expect(result).to.be.true;
        });

        it("should return false if the method doesn't match", () => {
          var result = route.match('POST', '/the/truth/is-out-there');
          expect(result).to.be.false;
        });

        it("should return false if the path doesn't match", () => {
          var result = route.match('GET', '/the/truth/is-right-here');
          expect(result).to.be.false;
        });

        it('should anchor the beginning of the regexp matcher', () => {
          var result = route.match('GET', '/maybe/the/truth/is-out-there');
          expect(result).to.be.false;
        });

        it('should anchor the ending of the regexp matcher', () => {
          var result = route.match('GET', '/the/truth/is-out-thereee');
          expect(result).to.be.false;
        });
      });

    });
  });

});
