'use strict';

module.exports = (req, res, radio) => {
  res.code = 404;
  res.body = {error: 'Not found'};
  radio.emit('ok');
};
