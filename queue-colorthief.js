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

  mongo.models.Photo.findById(download.photoId)
    .exec()
    .then(function (photo) {
      debug(download.photoId+" photo loaded from mongo");
      var dominantColor = photo.getDominantColor();
      if (dominantColor) {
        debug(download.photoId + ' already has a dominant color ' + JSON.stringify(dominantColor));
        callback();
      } else {
        var url = 'http://127.0.0.1:8000/?photoId='+download.photoId;
        debug(download.photoId+" requesting " + url);
        Q.nfcall(request, url)
          .then(function (data) {
            var response = data[0]
              , body = data[1];

            debug(download.photoId+" response " + body);

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
            photo.setDominantColor(info[0], info[1], info[2]);
            return photo.save()
          })
          .then(
          function success() {
            debug(download.photoId + ' saved in mongo (' + JSON.stringify(photo.getDominantColor()) + ')');
            callback();
          },
          function error(err) {
            debug(download.photoId + ' error ' + err);
            callback(err);
          }
        );
      }
    }).then(function () { }, function () {
      debug(download.photoId + ' error ' + err);
      callback(err);
    });
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
