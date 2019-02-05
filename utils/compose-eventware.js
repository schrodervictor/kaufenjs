'use strict';

var EventEmitter = require('events');

function parallel(eventware) {
  return function(req, res, radio) {
    var count = eventware.length + 1;
    var ok = false;
    var error = false;

    var control = getCallableEmitter({
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

    // Emit the "ok" event at least once (prevents empty eventware to hang)
    control.emit('ok');
  };
}

function serial(eventware) {
  return function(req, res, radio) {
    var count = eventware.length;
    if (!count && 'function' === typeof radio.emit) return radio.emit('ok');
    if (!count && 'function' === typeof radio) return radio();

    var head = eventware[0];
    var tail = eventware.slice(1);

    var control = getCallableEmitter({
      success: () => serial(tail)(req, res, radio),
      error: (err) => radio.emit('error', err)
    });

    if ('function' === typeof head.emit) head.emit('request', req, res, control);
    if ('function' === typeof head) head(req, res, control);
  };
}

function getCallableEmitter({ success, error }) {
  var emitter = new EventEmitter();
  emitter.on('ok', success);
  emitter.on('error', error);

  var callback = (err) => {
    if (err) return emitter.emit('error', err);
    emitter.emit('ok');
  };
  callback.emit = emitter.emit.bind(emitter);
  return callback;
}

module.exports = {
  parallel,
  serial
};
