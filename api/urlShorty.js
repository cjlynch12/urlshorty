var mongo = require('mongodb');
var express = require('express');
require('dotenv').config();
var app = express();
var shortid = require('shortid');
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
var validUrl = require('valid-url');


module.exports = function (app) {
//gen shortlink
app.route('/new/:url(*)')
  .get(function(req,res){
  mongo.MongoClient.connect(process.env.MLAB_URI, function(err,db){
    if (err) {
      console.log('Error connecting to server');
      throw err;
    } else {
      console.log('Connected to server');
    }
    var collection = db.collection('urls');
    var params = req.params.url;
    var local = req.get('host') + "/";
    var genShortLink = function(db, callback) {
      collection.findOne({ "url": params},function (err, doc){
        if (doc != null) {
          res.json({full_url : params, short_url: local + doc.short});
        } else {
          var newShortId = shortid.generate();
          var shortUrl = {url: params, short: newShortId};
          collection.insert([shortUrl]);
          res.json({original_url: params, short_url: local + newShortId});
        };
      });
    };
    if (validUrl.isUri(params)){
       genShortLink(db, function(){
         db.close();
       });
    } else {
      res.sendFile(process.cwd() + '/views/invalidUrl.html');
    }
  });  
});
//lookup
app.route('/:lookUpId')
  .get(function(req,res){
  
  mongo.MongoClient.connect(process.env.MLAB_URI, function(err,db){
      if (err) {
        console.log('Error connecting to server');
        throw err;
      } else {
        console.log('connected to server');
        var collection = db.collection('urls');
        var params = req.params.lookUpId;
      
        var lookup = function(db, callback) {
          collection.findOne({"short": params}, function(err,doc){
          if (doc != null) {
            res.redirect(doc.url);
          } else {
            res.json({error: "Could not find shortlink in the database"});
          };
        });
      };
      
      lookup(db,function() {
        db.close();
      });
        
    };  
  });
});
  
  
}