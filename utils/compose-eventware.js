'use strict';

var EventEmitter = require('events');

function parallel(eventware) {
  return function(req, res, radio) {
    var count = eventware.length;
    if (!count) return radio.emit('ok');

    var ok = false;
    var error = false;
    var done = false;

    var control = getEmitter({
      success: () => {
        if (done || ok || error || --count) return;
        ok = true;
        radio.emit('ok');
      },
      error: (err) => {
        if (done || ok || error) return;
        error = true;
        radio.emit('error', err);
      },
      done: () => {
        if (done || ok || error) return;
        done = true;
        radio.emit('done');
      },
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
      error: (err) => radio.emit('error', err),
      done: () => radio.emit('done'),
    });

    head(req, res, control);
  };
}

function getEmitter({ success, error, done }) {
  var emitter = new EventEmitter();
  if (success) emitter.on('ok', success);
  if (error) emitter.on('error', error);
  if (done) emitter.on('done', done);
  return emitter;
}

module.exports = {
  parallel,
  serial
};
