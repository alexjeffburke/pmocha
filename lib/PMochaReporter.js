"use strict";

/**
 * @module JSON
 */
/**
 * Module dependencies.
 */

const EventEmitter = require("events").EventEmitter;

var Base = require("mocha/lib/reporters/base");

/**
 * Initialize a new `JSON` reporter.
 *
 * @public
 * @class JSON
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @api public
 * @param {Runner} runner
 */
module.exports = class MochaMultiplexingReporter extends EventEmitter {
  constructor(runner) {
    super();
    Base.call(this, runner);

    var self = this;
    var reporters = [];
    var tests = [];
    var pending = [];
    var failures = [];
    var passes = [];

    var registeredEvents = {};

    var boundEventEmitterOn = this.on.bind(this);
    this.on = function(eventName, eventListener) {
      // pass through ant requested events
      if (!(eventName in registeredEvents)) {
        registeredEvents[eventName] = true;
        runner.on(eventName, (...args) => self.emit(eventName, ...args));
      }

      // attach child reporter to our event stream
      boundEventEmitterOn(eventName, eventListener);
    };

    this.addReporterFromConstructor = function(Reporter) {
      reporters.push(new Reporter(this));
    };

    this.on("test end", function(test) {
      tests.push(test);
    });

    this.on("pass", function(test) {
      passes.push(test);
    });

    this.on("fail", function(test) {
      failures.push(test);
    });

    this.on("pending", function(test) {
      pending.push(test);
    });

    this.once("end", function() {
      var obj = {
        stats: self.stats,
        tests: tests.map(clean),
        pending: pending.map(clean),
        failures: failures.map(clean),
        passes: passes.map(clean)
      };

      process.stderr.write(JSON.stringify(obj, null, 2));
    });

    const forwardReporterName = process.env.IMOCHA_REPORTER_BASE
      ? process.env.IMOCHA_REPORTER_BASE
      : "spec";
    this.addReporterFromConstructor(
      require(`mocha/lib/reporters/${forwardReporterName}`)
    );
  }
};

/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @api private
 * @param {Object} test
 * @return {Object}
 */
function clean(test) {
  var err = test.err || {};
  if (err instanceof Error) {
    err = errorJSON(err);
  }

  return {
    title: test.title,
    fullTitle: test.fullTitle(),
    duration: test.duration,
    currentRetry: test.currentRetry(),
    err: cleanCycles(err)
  };
}

/**
 * Replaces any circular references inside `obj` with '[object Object]'
 *
 * @api private
 * @param {Object} obj
 * @return {Object}
 */
function cleanCycles(obj) {
  var cache = [];
  return JSON.parse(
    JSON.stringify(obj, function(key, value) {
      if (typeof value === "object" && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Instead of going in a circle, we'll print [object Object]
          return "" + value;
        }
        cache.push(value);
      }

      return value;
    })
  );
}

/**
 * Transform an Error object into a JSON object.
 *
 * @api private
 * @param {Error} err
 * @return {Object}
 */
function errorJSON(err) {
  var res = {};
  Object.getOwnPropertyNames(err).forEach(function(key) {
    res[key] = err[key];
  }, err);
  return res;
}
