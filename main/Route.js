'use strict';

class Route {
  constructor(method, pattern) {
    this.method = method;
    this.pattern = pattern;
    this.setPathMatcher();
  }

  match(method, path) {
    if (method !== this.method) return false;
    return this.matchPath(path);
  }

  matchPath(path) {
    return false;
  }

  setPathMatcher() {
    if ('string' !== typeof this.pattern) return;

    if (this.pattern.charAt(0) === '/') {
      return this.useExactMatch();
    }

    if (this.pattern.charAt(0) === '~') {
      return this.useRegExpMatch();
    }
  }

  useExactMatch() {
    this.matchPath = (path) => path === this.pattern;
  }

  useRegExpMatch() {
    var pattern = this.pattern.substr(1).trim();
    var regexp = new RegExp('^' + pattern + '$');
    this.matchPath = (path) => regexp.test(path);
  }
}

module.exports = Route;
