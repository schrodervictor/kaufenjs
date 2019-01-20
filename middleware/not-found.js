'use strict';

module.exports = (req, res, next) => {
  res.code = 404;
  res.body = {error: 'Not found'};
  next();
};
