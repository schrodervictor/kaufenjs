var EventEmitter = require('events');

var Route = require('./Route');
var compose = require('../utils/compose-middleware');
var notFound = require('../middleware/not-found');


class API extends EventEmitter {
  constructor() {
    super();
    this.routes = [];
    this.on('request', this.handleRequest);
  }

  handleRequest(req, res, callback) {
    var route = this.match(req.method, req.url);
    var middleware = route ? route.middleware : [];
    middleware = [...middleware, notFound];
    compose(middleware)(req, res, callback);
  }

  route(method, pattern, middleware) {
    var route = this.getRoute(method, pattern);
    if (!route) route = this.addRoute(method, pattern);
    route.middleware.push(middleware);
  }

  match(method, url) {
    return this.routes.find((route) => route.match(method, url));
  }

  getRoute(method, pattern) {
    return this.routes.find((route) => {
      return route.method === method && route.pattern === pattern;
    });
  }

  addRoute(method, pattern) {
    var route = new Route(method, pattern);
    route.middleware = [];
    this.routes.push(route);
    this.sortRoutes();

    return route;
  }

  sortRoutes() {
    var regexpRoutes = this.routes.filter((route) => {
      return route.pattern.charAt(0) === '~';
    });

    var exactRoutes = this.routes.filter((route) => {
      return route.pattern.charAt(0) === '/';
    });

    regexpRoutes.sort((a, b) => a.pattern.length - b.pattern.length);
    exactRoutes.sort((a, b) => a.pattern.length - b.pattern.length);

    this.routes = [...exactRoutes, ...regexpRoutes];
  }
}

module.exports = API;
