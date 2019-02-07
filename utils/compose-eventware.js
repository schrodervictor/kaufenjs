'use strict';

var EventEmitter = require('events');

function parallel(eventware) {
  return function(req, res, radio) {
    var count = eventware.length;
    if (!count) return radio.emit('ok');

    var ok = false;
    var error = false;

    var control = getEmitter({
      success: () => {
        if (ok || error || --count) return;
        ok = true;
        radio.emit('ok');
      },
      error: (err) => {
        if (ok || error) return;
        error = true;
        radio.emit('error', err);
      }
    });

    eventware.map(handler => handler(req, res, control));
  };
}

function serial(eventware) {
  return function(req, res, radio) {
    var count = eventware.length;
    if (!count) return radio.emit('ok');

    var head = eventware[0];
    var tail = eventware.slice(1);

    var control = getEmitter({
      success: () => serial(tail)(req, res, radio),
      error: (err) => radio.emit('error', err)
    });

    head(req, res, control);
  };
}

function getEmitter({ success, error }) {
  var emitter = new EventEmitter();
  emitter.on('ok', success);
  emitter.on('error', error);
  return emitter;
}

module.exports = {
  parallel,
  serial
};
