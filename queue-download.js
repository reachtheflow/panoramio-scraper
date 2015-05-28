'use strict';

var assert = require('assert');

var async = require('async')
  , Q = require('q');

var conf = require('./conf.js');

var DownloadPhoto = require('./downloadphoto.js');

var debug = require('debug')('scraper:queue:download');

var unqueueDownloadWorker = function (scraper, photoId, callback) {
  assert(scraper);
  assert(photoId);

  debug(photoId + ' unqueue');
  var download = new DownloadPhoto({
    photoId:photoId,
    baseDirectory:conf['photos.baseDirectory']
  });
  download.isAlreadyDownloaded()
    .then(function (downloaded) {
      if (!downloaded) {
        debug(photoId + ' has not been downloaded yet => download');
        // FIXME: delay parametrable
        return download.start().then(function () { return Q.delay(100); });
      } else {
        debug(photoId + ' has already been downloaded');
      }
    })
    .then(function () {
      scraper.emit('queue.download', download);
    })
    .then(function success() { callback(); },
          function error(err) { callback(err); });
};

module.exports = function (scraper, options) {
  assert(scraper);

  options = options || {};
  //
  var queue = async.queue(
    unqueueDownloadWorker.bind(null, scraper),
    options.downloadsConcurrency || 1
  );
  //
  scraper.on('queue.request', function (request) {
    queue.push(request.photos);
  });
  //
  return queue;
};