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

function fetchVideoInfo(id, cb) {
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
                cb({error: "Empty response"});
            }
        }
    });
}

function matchTitle(info) {
    var match = info.title.match(/(?:(.+?)\s*-\s*(.+?)\s*(?:\(\s*(.+?)\s*\)\s*)?$)|(.*)/);

    if (match[4]) {
        info.song = match[4];
        info.simple = true;
    } else {
        info.artist = match[1];
        info.song = match[2];
        info.extra = match[3];
    }
}

function downloadVideo(info, cb) {
    matchTitle(info);

    if (info.simple) {
        mp3.download(BASE_URL + info.id, info.song + EXTENSION, function (err) {
            cb(err, info);
        });
    } else {
        mkdirp(info.artist, function (err, made) {
            if (err) {
                cb(err);
            } else {
                var file = info.artist + "/" + info.song;

                if (info.extra) {
                    file += "(" + info.extra + ")";
                }

                mp3.download(BASE_URL + info.id, file + EXTENSION, function (err) {
                    cb(err, info);
                });
            }
        });
    }
}

process.stdin.on('data', function (data) {
    var ids = _(data.toString().split(/\n|\r| /))
        .filter(function (e) { return !!e })
        .map(function (s) {
            var m = s.match(/(?:.*watch?.*v=)?([^&]*)/);
            return m ? m[1] : null;
        }).value();

    _a.map(ids, _a.compose(downloadVideo, fetchVideoInfo), function (err, results) {
        console.dir(results);
    });
});
