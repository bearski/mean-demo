var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var fs = require('fs');
var q = require('q');
var app = express();
var mongoose = require('mongoose');
var mongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var objectId = require('mongodb').ObjectID;

//var mongoUrl = '[URLTODB]';
var mongoUrl = process.env.MONGODB_URI;


app.set('port', process.env.PORT || 7003);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/createUser', function(req, res) {
    q.fcall(function() {
        var templateDeferred = q.defer();
        fs.readFile('./json/template.json', 'utf8', function(err, data) {
            if (err) {
                throw err;
            }
            var userTemplate = JSON.parse(data);
            templateDeferred.resolve(userTemplate);
        });
        return templateDeferred.promise;
    }).then(function(template) {
        mongoClient.connect(mongoUrl, function(err, db) {
            assert.equal(null, err);
            db.collection('users').insertOne(template, function(err, result) {
                assert.equal(err, null);
                console.log("Inserted a document into the user collection.");
                res.send(result.insertedId);
            });
        });
    })
});

app.get('/template', function(req, res) {
    fs.readFile('./json/template.json', 'utf8', function(err, data) {
        if (err) {
            throw err;
        }
        res.send(data);
    });
})

app.get('/users', function(req, res) {
    mongoClient.connect(mongoUrl, function(err, db) {
        assert.equal(null, err);
        var cursor = db.collection('users').find({
            '_id': objectId(req.query._id)
        });
        cursor.each(function(err, doc) {
            assert.equal(err, null);
            if (doc != null) {
                res.send(doc);
            } else {
                db.close();
            }
        });
    });
});

app.post('/updateUser', function(req, res) {
    var userObj = req.body;
    var id = userObj._id;
    delete userObj._id;
    mongoClient.connect(mongoUrl, function(err, db) {
        assert.equal(null, err);
        db.collection('users').replaceOne({
                "_id": objectId(id)
            }, userObj,
            function(err, results) {
                res.send(results);
                db.close();
            });
    });
});

app.use(express.static(__dirname + '/public'));

http.createServer(app).listen(app.get('port'), function() {
    console.log('Server is running on port ' + app.get('port'));
});