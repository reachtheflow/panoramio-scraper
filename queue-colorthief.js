'use strict';

var assert = require('assert');

var async = require('async')
  , Q = require('q');

var request = require('request');

var debug = require('debug')('scraper:queue:colorthief');

var mongo = require('./mongo.js');

var unqueueColorthief = function (scraper, download, callback) {
  assert(scraper);
  assert(download);

  debug(download.photoId + ' unqueue');

  Q.nfcall(request, 'http://127.0.0.1:8000/?photoId='+download.photoId)
    .then(function (data) {
      var response = data[0]
        , body = data[1];

      if (response.statusCode !== 200) {
        throw download.photoId+" wrong status code";
      }
      var info = JSON.parse(body);
      if (!Array.isArray(info) || info.length !== 3) {
        throw download.photoId+" wrong format "+body;
      }
      // on va enregistrer dans mongo cette info !
      debug(download.photoId + ' saving '+body+' in mongo');
      //
      return mongo.models.Photo.findByIdAndUpdate(
        download.photoId,
        {
          dominantColor: {
            r: info[0],
            g: info[1],
            b: info[2]
          }
        }
      ).exec();
    })
    .then(
      function success() {
        debug(download.photoId + ' saved in mongo');
        callback();
      },
      function error(err) {
        debug(download.photoId + ' error ' + err);
        callback(err);
      }
    );
};

module.exports = function (scraper, options) {
  assert(scraper);

  options = options || {};
  //
  var queue = async.queue(
    unqueueColorthief.bind(null, scraper),
    options.requestsConcurrency || 1
  );
  //
  scraper.on('queue.download', function (download) {
    queue.push(download);
  });
  //
  return queue;
};
