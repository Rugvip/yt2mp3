#!/usr/bin/env node

require('colors');
var _ = require('lodash'),
    _a = require('async'),
    request = require('request'),
    ui = require('./ui.js'),
    downloader = require('./downloader');

var videoIdRegex = /(?:v=|^)([a-zA-Z0-9_-]{11})(?:$|[^a-zA-Z0-9_-])/;
var playlistIdRegex = /PL(?:[A-F0-9]{16}|[a-zA-Z0-9_-]{32})/;

var PLAYLIST_URL = _.template('https://gdata.youtube.com/feeds/api/playlists/${id}?v=2&alt=json');

if (process.argv.length < 3) {
    console.log("Pass video url/id as arguments".red.bold);
    ui.stop();
} else {
    var args = _.drop(process.argv, 2);

    var playlists = _(args)
        .map(function (str) {
            var m = str.match(playlistIdRegex);
            return m ? m[0] : null;
        })
        .compact()
        .value();

    var videos = _(args)
        .map(function (str) {
            var m = str.match(videoIdRegex);
            return m ? m[1] : null;
        })
        .compact()
        .value();

    _a.map(playlists, function (id, callback) {
        request.get(PLAYLIST_URL({id: id}), {
            json: true
        }, function (err, res, body) {
            if (err) {
                callback(err);
            }

            var ids = _(body.feed.entry || [])
                .pluck('media$group')
                .pluck('yt$videoid')
                .pluck('$t')
                .value();

            callback(null, ids);
        });
    }, function (err, result) {
        if (err) {
            return console.error("failedot fetch playlist items: %j", err);
        }

        videos = _(videos.concat(result))
            .flatten()
            .uniq()
            .value();

        downloadVideos(videos);
    });
}

function downloadVideos(videos) {
    _a.map(videos, function (id, callback) {
        callback = _.once(callback);

        var download = downloader.startDownload(id);

        download.on('start', function (length) {
            var bar = new ui.ProgressBar({
                max: length,
                title: download.title.green.bold
            });
            download.on('tick', function (tick) {
                bar.tick(tick);
            });
            download.on('done', function () {
                callback();
            });
        });
        download.on('error', function (err) {
            var bar = new ui.ProgressBar({
                max: 1,
                title: err.error.red.bold
            });
            bar.tick(0);
            callback();
        });
    }, function (err, result) {
        ui.stop();
    });
}
