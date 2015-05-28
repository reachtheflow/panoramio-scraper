'use strict';

var assert = require('assert');

var debug = require('debug')('scraper:mongo');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Request = require('./request.js');

//////////////// SCHEMAS ///////////////
module.exports.schemas = {};

module.exports.schemas.requestGetPhotos = new Schema({
  _id: String, // "{minx:42.4112,maxx:42.4113,miny:5,maxy:5.00234234}"
  params: {
    minx: Number,
    miny: Number,
    maxx: Number,
    maxy: Number
  },
  //
  photos: [ String ],
  nbPhotos: { type: Number, default: 0 },
  full: { type: Boolean, default: false }, // true if nbPhotos equals 99
  //
  parentId: String, // requestId
  deepth: { type: Number, default: 0 },
  step: { type: Number, enum: Request.steps },
  //
  date: {
    creation: { type: Date, default: Date.now }
  }
});

module.exports.schemas.requestGetPhotos.statics.fromRequest = function (request) {
  assert(request);
  assert(request.id);
  assert(request.photos);

  return new (module.exports.models.RequestGetPhotos)({
    _id: request.id,
    params: {
      minx: request.minx,
      miny: request.miny,
      maxx: request.maxx,
      maxy: request.maxy
    },
    // photos infos
    photos: request.photos,
    nbPhotos: request.photos.length,
    full: (request.photos.length === 99),
    //
    parentId: request.parentid,
    deepth: request.deepth,
    step: request.step
  });
};

/**
 * @param string id
 * @return Promise<boolean>
 */
module.exports.schemas.requestGetPhotos.statics.exist = function (id) {
  assert(id);

  return module.exports.models.RequestGetPhotos
    .findById(id)
    .exec()
    .then(function (m) { return !!m; });
};

module.exports.schemas.requestGetPhotos.methods.upsert = function () {
  debug('model RequestGetPhotos upsert '+this.id);
  var data = this.toObject();
  delete data._id; // usefull ?
  var p = module.exports.models.RequestGetPhotos.findByIdAndUpdate(
    this.id,
    data,
    { upsert: true }
  );
  return p.exec.apply(p, arguments);
};

module.exports.schemas.photo = new Schema({
  _id: String,
  location: {
    lat: Number,
    lng: Number
  },
  dominantColor: { r: Number, g: Number, b: Number },
  date: {
    creation: { type: Date, default: Date.now },
    update: { type: Date, default: Date.now }
  },
  panoramio: mongoose.Schema.Types.Mixed
});

module.exports.schemas.photo.statics.fromPanoramio = function (photo) {
  if (!photo) { throw "empty panoramio model photo"; }
  if (!photo.photoId) { throw "missing photoId property in panoramio model "+JSON.stringify(photo); }
  if (!photo.position ||
    typeof photo.position.lat === 'undefined' ||
    typeof photo.position.lng === 'undefined') {
    throw "missing lat/lng in panoramio model "+JSON.stringify(photo);
  }
  return new (module.exports.models.Photo)({
    _id: photo.photoId,
    location: {lat: photo.position.lat, lng: photo.position.lng},
    panoramio: photo
  });
};

module.exports.schemas.photo.methods.upsert = function () {
  debug('model Photo upsert '+this.id);
  var data = this.toObject();
  delete data._id; // usefull ?
  var p = module.exports.models.Photo.findByIdAndUpdate(
    this.id,
    data,
    { upsert: true });
  return p.exec.apply(p, arguments);
};

//////////////// MODELS ///////////////
module.exports.models = {};

module.exports.models.RequestGetPhotos = mongoose.model('RequestGetPhotos', module.exports.schemas.requestGetPhotos);
module.exports.models.Photo = mongoose.model('Photo', module.exports.schemas.photo);
