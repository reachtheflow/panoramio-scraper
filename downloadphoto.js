'use strict';

var assert = require('assert');

var fs = require('fs');

var Q = require('q')
  , mkdirp = require('mkdirp')
  , request = require('request');

var debug = require('debug')('scraper:download');

var Panoramio = require('./panoramio.js')
  , panoramio = new Panoramio();

/**
 * Download a single photo based on the id.
 */
var DownloadPhoto = function (options) {
  assert(options);
  assert(typeof options.photoId === 'string');
  assert(typeof options.baseDirectory === 'string' && options.baseDirectory);

  this.photoId = options.photoId;
  this.baseDirectory = options.baseDirectory;
  // computed properties
  this.url = panoramio.getThumbnailUrl(this.photoId);
  this.photoDirectory = this.baseDirectory+DownloadPhoto.photoIdToDirectory(this.photoId);
  this.photoPath = this.photoDirectory+this.photoId+'.jpg';
};
/**
 * return the image path when saved.
 * @return Promise<DownloadPhoto>
 */
DownloadPhoto.prototype.start = function () {
  debug(this.photoId+' start');
  var that = this;
  return Q.nfcall(mkdirp, this.photoDirectory)
    .then(function () {
      var deferred = Q.defer();
      request(that.url).pipe(fs.createWriteStream(that.photoPath)).on('close', function () {
        debug(that.photoId+' downloaded into '+that.photoPath);
        deferred.resolve(that);
      });
      return deferred.promise;
    });
};

/**
 * @return Promise<boolean>
 */
DownloadPhoto.prototype.isAlreadyDownloaded = function () {
  var deferred = Q.defer();
  fs.exists(this.photoPath, function (exists) {
    deferred.resolve(exists);
  });
  return deferred.promise;
};

DownloadPhoto.photoIdToDirectory = function (photoId) {
  photoId = String(photoId);
  var directory = '';
  for (var i = 0; i < photoId.length; ++i) {
    if (i && i % 2 === 0) {
      directory += "/";
    }
    directory += photoId[i];
  }
  directory += "/";
  return directory;
};

module.exports = DownloadPhoto;