var request = require('request');
var prompt = require('prompt');
var _ = require('lodash');
var _a = require('async');
var mp3 = require('youtube-mp3');
var mkdirp = require('mkdirp')
require('colors');

var API_URL = "https://www.googleapis.com/youtube/v3";
var API_KEY = "AIzaSyCu0eybzj30lAzAV08xpF0bZQSZEFohJvo";
var BASE_URL = "http://www.youtube.com/watch?v=";
var EXTENSION = ".mp3";

var queue = _a.queue(function (id, callback) {
    _a.compose(downloadVideo, fetchVideoInfo)(id, callback);
}, 1);

function fetchVideoInfo(id, cb) {
    console.log("Fetching video with id: " + id);
    request.get({
            url: API_URL + "/videos",
            qs: {
                part: "snippet",
                id: id,
                key: API_KEY
            },
            json: true
        }, function (err, res, body) {
        if (err) {
            console.err("Could not get video info: " + err);
            cb(err);
        } else {
            if (body && body.items && body.items[0]) {
                var snippet = body.items[0].snippet;
                cb(null, {
                    title: snippet.title,
                    thumbnail: snippet.thumbnails.high,
                    id: id
                });
            } else {
                cb({error: "Video info got empty response"});
            }
        }
    });
}

function downloadVideo(info, cb) {
    mp3.download(BASE_URL + info.id, info.title.replace(/\?|\!|\.|%|#|\$|\@/, "") + EXTENSION, function (err) {
        cb(err, info);
    });
}

process.stdin.on('data', function (data) {
    var ids = _(data.toString().split(/\n|\r| /))
        .filter(function (e) { return !!e })
        .map(function (s) {
            var m = s.match(/(?:.*watch?.*v=)?([^&]*)/);
            return m ? m[1] : null;
        }).value();

    queue.push(ids, function (err, wat) {
        console.dir(wat);
        if (err) {
            console.log("Video download failed: " + err);
        }
    });
});
