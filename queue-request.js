'use strict';

var assert = require('assert');

var async = require('async');

var debug = require('debug')('scraper:queue:request');

var unqueueRequestWorker = function (scraper, request, callback) {
  assert(scraper);
  assert(request);
  assert(typeof callback === 'function');

  debug(request.id + ' unqueue');
  request.existInMongo()
    .then(function (exist) {
      debug(request.id + ' ' + (exist?'exist':'send'));
      if (exist) {
        return request.loadFromMongo();
      }
      return request.send()
        .then(function () {
          return request.saveInMongo();
        });
    })
    .then(function () {
      if (request.isFull() && request.canBeSplitted()) {
        debug(request.id + ' isFull and can be splitted');
        var subRequests = request.split();
        scraper.queues.request.push(subRequests);
      } else {
        debug(request.id + ' end');
      }
    })
    .then(function () {
      // after the request is saved, we can download the photos
      scraper.emit('queue.request', request);
    })
    .then(function success() { callback(); },
          function error(err) { callback(err); });
};

module.exports = function (scraper, options) {
  assert(scraper);

  options = options || {};
  var queue = async.queue(
    unqueueRequestWorker.bind(null, scraper),
    options.requestsConcurrency || 1
  );
  return queue;
};