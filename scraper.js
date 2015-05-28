'use strict';

/**
 * usage:
 *
 *  var Scraper = require('panoramio-scraper')
 *
 *  var scraper = new Scraper();
 *
 *  scraper.on('scraped', function (photo) {
 *    // photo is object @see panoramio documentation
 *  });
 *  scraper.on('error', function () { });
 *  scraper.on('end', function () { });
 *
 *  scraper.fetch({
 *    minx: 42,      // mandatory
 *    miny: 5,       // mandatory
 *    maxx: 43,      // mandatory
 *    maxy: 6,       // mandatory
 *    step: 0.125,   // mandatory
 *    requestsConcurrency: 1,    // optional, default = 1
 *    downloadsConcurrency: 1,   // optional, default = 1
 *    requestsDelay: 100         // optional, default = 100
 *    downloadsDelay: 100        // optional, default = 100
 *  });
 */

var assert = require('assert');

var util = require("util");
var events = require("events");

var Q = require('q');

var Request = require('./request.js');

var queueRequest = require('./queue-request.js')
  , queueDownload = require('./queue-download.js')
  , queueColorThief = require('./queue-colorthief.js');

var debug = require('debug')('scraper:scraper');

var Scraper = function (options) {
  options = options || {};

  this.queues = { };
  this.queues.request = queueRequest(this, options);
  if (!options.nodownload) {
    this.queues.download = queueDownload(this, options);
  }
  if (!options.nocolorthief) {
    this.queue.colorthief = queueColorThief(this, options);
  };
};
//
util.inherits(Scraper, events.EventEmitter);
//
Scraper.prototype.fetch = function (options) {
  assert(options);
  assert(typeof options.minx === 'number');
  assert(typeof options.miny === 'number');
  assert(typeof options.maxx === 'number');
  assert(typeof options.maxy === 'number');
  assert(options.minx < options.maxx);
  assert(options.miny < options.maxy);
  assert(typeof options.step === 'number');
  assert(Request.steps.indexOf(options.step) !== -1);

  debug('start '+JSON.stringify(options));

  // creating requests, and add to the queue
  var minx, miny, request;
  for (minx = options.minx; minx < options.maxx; minx += options.step) {
    for (miny = options.miny; miny < options.maxy; miny += options.step) {
      request = new Request({minx: minx, miny: miny, step: options.step});
      this.queues.request.push(request);
    }
  }
  // waiting all queues to finish before resolving.
  return Q.all(
    Object.keys(this.queues).map(function (q) {
      var deferred = Q.defer();
      this.queues[q].drain = function () { deferred.resolve(); };
      return deferred.promise;
    }, this)
  );
};
module.exports = Scraper;