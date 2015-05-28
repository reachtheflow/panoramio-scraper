'use strict';

/**
 * ColorThief is segfaulting...
 *  Spawning a cluster of workers
 */
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs + 5; i++) {
    cluster.fork();
  }
  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
    cluster.fork();
  });
} else {
  // nodejs modules
  var assert = require('assert');
  var fs = require('fs');

  // third-party libs
  var express = require('express')
    , app = express();
  var ColorThief = require('color-thief')
    , colorthief = new ColorThief();

  // our libs
  var DownloadPhoto = require('./downloadphoto.js')

  // conf
  var conf = require('./conf.js');

  app.get('/', function (req, res) {
    console.log(req.query);
    var photoId = req.query.photoId;
    if (!photoId) {
      return res.status(500).json({error:'missing photoId'});
    }
    // recomposing photoPath
    var photoPath = conf['photos.baseDirectory']+DownloadPhoto.photoIdToDirectory(photoId)+photoId+'.jpg';
    fs.exists(photoPath, function (exists) {
      if (!exists) {
        return res.status(500).json({error:photoPath+' doesnt exist'});
      }
      //
      var color = colorthief.getColor(photoPath);
      res.json(color);
    });
  });

  app.listen(8000);
}

