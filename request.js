'use strict';

var assert = require('assert');

var Q = require('q');

var Panoramio = require('./panoramio.js')
  , mongo = require('./mongo.js');

var debug = require('debug')('scraper:request');

/**
 * What is a scraper request ? it's a "tile-normalized" request.
 *
 * Scrapped request can only use specific lat/lng in order to cover the full map with a grid
 */
var Request = function (options) {
  assert(options);
  assert(typeof options.minx === 'number');
  assert(typeof options.miny === 'number');
  assert(typeof options.step === 'number');
  assert(this.isNormalized(options.minx, options.miny, options.step));

  this.id = JSON.stringify({minx:options.minx,miny:options.miny,step:options.step});
  this.minx = options.minx;
  this.miny = options.miny;
  this.maxx = options.minx + options.step;
  this.maxy = options.miny + options.step;
  this.step = options.step;
  this.deepth = Request.steps.indexOf(options.step);
  // data from http req or in db
  this.parentid = options.parentid || '';
  this.photos = [/* "id", "id", ...*/ ];
  this.panoramioPhotos = null; // [ model, model, ... ]
  this.sended = false;
};
/**
 * we consider a request associated to a tile full
 * when the tile will be "full" of pictures,
 *  > 20 pictures
 *
 * The real full value by panoramio is empiricaly 99
 * but it happens that panoramio returns sometimes less than 99
 *
 * @returns {boolean}
 */
Request.prototype.isFull = function () {
  assert(this.sended);
  return this.photos.length > 20;
};
/**
 * @return Promise<Request>
 */
Request.prototype.send = function () {
  debug('send '+this.id);
  var panoramio = new Panoramio();
  var that = this;
  return panoramio.getPhotos({
    minx: this.minx,
    maxx: this.minx + this.step,
    miny: this.miny,
    maxy: this.maxy + this.step
  }).then(function (photos) {
    that.panoramioPhotos = photos;
    that.photos = photos.map(function (p) { return p.photoId; })
    that.sended = true;
    return that;
  });
};
/**
 * @return Promise<boolean>
 */
Request.prototype.existInMongo = function () {
  assert(this.id);

  return mongo.models.RequestGetPhotos.exist(this.id);
};
/**
 * @return Request
 */
Request.prototype.loadFromMongo = function () {
  var that = this;
  return mongo.models.RequestGetPhotos.findById(this.id)
    .exec()
    .then(function (data) {
      that.parentId = data.parentId;
      that.photos = data.photos;
      that.sended = true;
      return that;
    }.bind(this));
};
/**
 * This function will save every panoramio photos models
 * and then, if everything is ok, it will save a requestgetphotos model.
 *
 * @return Promise<Model>
 */
Request.prototype.saveInMongo = function () {
  assert(this.id);
  assert(this.sended);
  assert(this.panoramioPhotos);

  // saving the photo models first
  var modelsPhotos = this.panoramioPhotos.map(mongo.models.Photo.fromPanoramio);
  var modelsPhotosUpserted = modelsPhotos.map(function (photo) {
    return photo.upsert();
  });
  var modelRequest = mongo.models.RequestGetPhotos.fromRequest(this);
  // saving photos and request
  return Q.all(modelsPhotosUpserted)
    .then(function () { return modelRequest.upsert(); });
};
Request.prototype.isNormalized = function (minx, miny, step) {
  assert(typeof minx === 'number');
  assert(typeof miny === 'number');
  assert(typeof step === 'number');

  return Request.steps.indexOf(step) !== -1 &&
    minx % step === 0 &&
    miny % step === 0;
};
/**
 * tels if the request can be splitted into subrequests
 * @return Boolean
 * @see split
 */
Request.prototype.canBeSplitted = function () {
  var maxDeepth = Request.steps.length - 1;
  return this.deepth < maxDeepth;
};
/**
 * split a request associated to a tile in 4 subrequests associated to the subtiles of the grid
 *
 *  +-------+     +-------+
 *  |       |     |   |   |
 *  |       |  => |---+---|
 *  |       |     |   |   |
 *  +-------+     +-------+
 *
 * @returns [ Request, Request, Request, Request ]
 */
Request.prototype.split = function () {
  assert(this.canBeSplitted());

  debug('split '+this.id);

  var newStep = this.step / 2;
  return [
    new Request({minx:this.minx,miny:this.miny,step:newStep}),
    new Request({minx:this.minx+newStep,miny:this.miny,step:newStep}),
    new Request({minx:this.minx,miny:this.miny+newStep,step:newStep}),
    new Request({minx:this.minx+newStep,miny:this.miny+newStep,step:newStep})
  ];
};
Request.steps = [ 1, 0.5, 0.250, 0.125, 0.0625, 0.03125, 0.015625, 0.0078125, 0.00390625, 0.001953125, 0.0009765625 ];

module.exports = Request;