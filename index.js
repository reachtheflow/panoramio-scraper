'use strict';

var conf = require('./conf.js');

var mongoose = require('mongoose');
mongoose.connect(conf['mongoose.connect']);

var Scraper = require('./scraper.js');

var scraper = new Scraper({
  requestsConcurrency: 2,
  downloadsConcurrency: 2,
  colorthiefConcurrency: 1
});

scraper.fetch({
  minx: 0,
  miny: 47,
  maxx: 1,
  maxy: 48,
  step: 1
}).then(function () {
  console.log('finished !');
  setTimeout(function () {
    process.exit(0);
  }, 2000);
});