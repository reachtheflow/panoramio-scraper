'use strict';

var assert = require('assert');

/*global describe, it*/
describe('Panoramio', function (){
  describe('#getPhotos()', function (){
    it('should return a list of photos', function (o){
      this.timeout(5000);

      var Panoramio = require('../panoramio.js');
      var panoramio = new Panoramio();
      panoramio.getPhotos({minx:4.835, miny:45.750, maxx:4.837, maxy:45.752})
        .then(function success(photos) {
          assert(Array.isArray(photos));

          console.log('success');
          console.log('Nb photos: ' + photos.length);
        }).done(o,o);
    });
  });
});
