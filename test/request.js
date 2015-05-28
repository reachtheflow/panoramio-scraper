'use strict';

var assert = require('assert');

var Request = require('../request.js');

/*global describe, it, before*/
describe('Request', function (){
  var mongoose = require('mongoose');
  mongoose.set('debug', true);

  before(function (done) {
    mongoose.connect('mongodb://localhost/ut');
    mongoose.connection.once('open', function () {
      mongoose.connection.db.dropDatabase(done);
    });
  });

  describe('instantiate', function (){
    it('should not throw any error if data is ok', function (o){
      var r1 = new Request({minx: 0, miny: 0, step: 1});
      var r2 = new Request({minx: 0.250, miny: 4.125, step: 0.125});
      var r3 = new Request({minx: 42, miny: 5, step: 1});
      o();
    });

    it('should not throw an exeception if not normalized call', function (o){
      try {
        var r1 = new Request({minx: 0.5, miny: 0, step: 1});
      } catch (e) { o(); }
    });
  });

  describe('send', function () {
    it('should send a request grabbing data', function (o) {
      this.timeout(5000);

      var r = new Request({minx: 2, miny: 45, step: 1});
      r.send().then(function (data) {
        o();
      }, o);
    });
  });

  describe('save', function () {
    it('should save a request in mongo', function (o) {
      this.timeout(5000);

      var r = new Request({minx: 2, miny: 45, step: 1});
      r.send()
       .then(function (data) {
        return r.saveInMongo();
      })
       .then(function () {
          console.log('saved');
          return r.existInMongo();
        })
        .then(function (bool) {
           o(bool ? null: 'doesnt exist in DB');
        }, o);
    });
  });
});
