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
    if (err) throw err;
    var collection = db.collection('urls');
    var rootUrl = req.params.url;
    var hostName = req.get('host') + "/";
    var genShortLink = function(db, callback) {
      collection.findOne({ "url": rootUrl},function (err, doc){
        if (doc != null) {
          res.json({full_url : rootUrl, short_url: hostName + doc.short});
        } else {
          var newShortId = shortid.generate();
          collection.insert({url: rootUrl, short: newShortId});
          res.json({original_url: rootUrl, short_url: hostName + newShortId});
        };
      });
    };
    if (validUrl.isUri(rootUrl)){
       genShortLink(db, function(){
         db.close();
       });
    } else {
      res.json({error: 'Please enter a valid URL (HTTP://...)'});
    }
  });  
});
  
//lookup
app.route('/:lookUpId')
  .get(function(req,res){
  mongo.MongoClient.connect(process.env.MLAB_URI, function(err,db){
      if (err) throw err;
      var collection = db.collection('urls');
      var lookUpId = req.params.lookUpId;
      var lookup = function(db, callback) {
      collection.findOne({"short": lookUpId}, function(err,doc){
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
  });
});
  
  
}
