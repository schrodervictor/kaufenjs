'use strict';

var EventEmitter = require('events');

var Route = require('./Route');
var serial = require('../utils/compose-eventware').serial;
var notFound = require('../eventware/not-found');


class API extends EventEmitter {
  constructor() {
    super();
    this.routes = [];
    this.on('request', this.handleRequest);
  }

  handleRequest(req, res, callback) {
    callback = callback || function() {};
    var route = this.match(req.method, req.url);
    var eventware = route ? route.eventware : [];

    var radio = new EventEmitter();
    radio.on('ok', callback);
    radio.on('done', callback);
    radio.on('error', callback);

    serial([...eventware, notFound])(req, res, radio);
  }

  route(requestSpecs, eventware) {
    var method = this.getMethodFromSpecs(requestSpecs);
    var pattern = this.getUriFromSpecs(requestSpecs);

    var route = this.getRoute(method, pattern);
    if (!route) route = this.addRoute(method, pattern);
    route.eventware.push(eventware);
  }

  getMethodFromSpecs(requestSpecs) {
    return [
      'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'
    ].find((verb) => requestSpecs.startsWith(verb));
  }

  getUriFromSpecs(requestSpecs) {
    return requestSpecs.slice(requestSpecs.indexOf(' ') + 1);
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
    route.eventware = [];
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
