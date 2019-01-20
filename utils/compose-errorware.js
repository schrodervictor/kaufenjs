'use strict';

function compose(errorware) {
  if (!errorware.length) {
    return function(err, _req, _res, next) { next(err); };
  }

  var head = errorware[0];
  var tail = errorware.slice(1);

  return function(err, req, res, next) {
    head(err, req, res, function() {
      compose(tail)(err, req, res, next);
    });
  };
}

module.exports = compose;
