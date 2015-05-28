'use strict';

/*
 * wrapper around panoramio api for nodejs.
 *   only getPhotos()
 *
 * var panoramio = new Panoramio();
 * panoramio.getPhotos({minx: 42, maxx: 42.1, miny: 12, maxy: 12.1})
 *   .then(function (photos) {
 *
 *   });
 *
 * each result photos :
 *  {
 *    "height":998,
 *    "ownerId":3372244,
 *    "ownerName":"lolo 69",
 *    "ownerUrl":"http://www.panoramio.com/user/3372244",
 *    "photoId":24131994,
 *    "photoPixelsUrls":[
 *      {
 *      "cropped":false,
 *      "height":333,
 *      "url":"http://mw2.google.com/mw-panoramio/photos/medium/24131994.jpg",
 *      "width":500
 *      },
 *      {
 *      "cropped":false,
 *      "height":80,
 *      "url":"http://static.panoramio.com/photos/iw-thumbnail/24131994.jpg",
 *      "width":120
 *      },
 *      {
 *      "cropped":false,
 *      "height":998,
 *      "url":"http://static.panoramio.com/photos/1920x1280/24131994.jpg",
 *      "width":1500
 *      },
 *      {
 *      "cropped":false,
 *      "height":681,
 *      "url":"http://static.panoramio.com/photos/large/24131994.jpg",
 *      "width":1024
 *      },
 *      {
 *      "cropped":false,
 *      "height":67,
 *      "url":"http: //mw2.google.com/mw-panoramio/photos/thumbnail/24131994.jpg",
 *      "width":100
 *      },
 *      {
 *      "cropped":true,
 *      "height":60,
 *      "url":"http://mw2.google.com/mw-panoramio/photos/square/24131994.jpg",
 *      "width":60
 *      },
 *      {
 *      "cropped":false,
 *      "height":160,
 *      "url":"http://mw2.google.com/mw-panoramio/photos/small/24131994.jpg",
 *      "width":240
 *      },
 *      {
 *      "cropped":true,
 *      "height":32,
 *      "url":"http://mw2.google.com/mw-panoramio/photos/mini_square/24131994.jpg",
 *      "width":32
 *      }
 *      ],
 *      "photoTitle":"Matin calme sur Lyon",
 *      "photoUrl":"http://www.panoramio.com/photo/24131994",
 *      "position":{"lat":45.758968,"lng":4.837643},
 *      "width":1500
 *      }
 */
var panoramioGetPhotosApiUrl = 'http://www.panoramio.com/wapi/data/get_photos?v=1&key=%key%&minx=%minx%&miny=%miny%&maxx=%maxx%&maxy=%maxy%&set=public&offset=0&length=257'
  , panoramioThumbnailUrl = 'http://mw2.google.com/mw-panoramio/photos/mini_square/%photoId%.jpg'
  , panoramioKey = 'dummykey'
  , userAgent = 'Mozilla/5.0 (Windows NT 6.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36';

var assert = require('assert')
  , request = require('request')
  , Q = require('q');

var debug = require('debug')('scraper:panoramio');

var Panoramio = function (options) {
  options = options || {};
  this.getPhotosApiUrl = options.getPhotosApiUrl || panoramioGetPhotosApiUrl;
  this.thumbnailUrl = options.thumbnailUrl || panoramioThumbnailUrl;
  this.key = options.key || panoramioKey;
  this.userAgent = options.userAgent || userAgent;
};
Panoramio.prototype.getPhotos = function (options) {
  assert(options);
  assert(typeof options.minx === 'number');
  assert(typeof options.maxx === 'number');
  assert(typeof options.miny === 'number');
  assert(typeof options.maxy === 'number');

  var requestUrl = this.getPhotosApiUrl
    .replace('%minx%', options.minx)
    .replace('%miny%', options.miny)
    .replace('%maxx%', options.maxx)
    .replace('%maxy%', options.maxy)
    .replace('%key%', this.key);
  var requestOptions = {
    url: requestUrl,
    headers: {
      'User-Agent': this.userAgent
    }
  };
  debug('GET '+requestOptions.url);
  return Q.nfcall(request, requestOptions)
    .then(function (data) {
      if (!data) { throw 'empty panoramio result'; }
      var response = data[0], body = data[1];
      if (response.statusCode !== 200) {
        throw 'panoramio status code != 200';
      }
      var info = JSON.parse(body);
      if (!Array.isArray(info.photos)) {
        throw 'unknown json format';
      }
      return info.photos;
    })
    // tap debug backend
    .then(
      function success(result) {
        debug('GET '+requestOptions.url+' OK => '+ result.length + ' photos');
        return result;
      },
      function error(err) {
        debug('GET '+requestOptions.url+' ERROR '+err);
        throw err;
      }
    );
};
Panoramio.prototype.getThumbnailUrl = function (photoId) {
  return this.thumbnailUrl.replace('%photoId%', photoId);
};


module.exports = Panoramio;

