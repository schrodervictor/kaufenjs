'use strict';

function compose(middleware) {
  if (!middleware.length) {
    return function(_req, _res, next) { next(); };
  }

  var head = middleware[0];
  var tail = middleware.slice(1);

  return function(req, res, next) {
    head(req, res, function(err) {
      if (err) return next(err);
      compose(tail)(req, res, next);
    });
  };
};

module.exports = compose;
