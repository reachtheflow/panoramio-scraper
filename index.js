'use strict';

var conf = require('./conf.js');

var mongoose = require('mongoose');
mongoose.connect(conf['mongoose.connect']);

var Scraper = require('./scraper.js');

var scraper = new Scraper({
  requestsConcurrency: 1,
  downloadsConcurrency: 1,
  nocolorthief: true,
  colorthiefConcurrency: 1
});

// complete :
//  minx:0 miny:45 maxx:6 maxy:47 step:1
//  minx:6 miny:45 maxx:8 maxy:46 step:1
//
//  minx:0 miny:47 maxx:2 maxy:48 step:1
//  minx:2 miny:47 maxx:4 maxy:48 step:1
//  minx:4 miny:47 maxx:6 maxy:48 step:1
//  minx:6 miny:47 maxx:8 maxy:48 step:1
scraper.fetch({
  minx: 6,
  miny: 45,
  maxx: 8,
  maxy: 46,
  step: 1
}).then(function () {
  console.log('finished !');
  setTimeout(function () {
    process.exit(0);
  }, 2000);
});