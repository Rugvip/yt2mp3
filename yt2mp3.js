#!/usr/bin/env node

require('colors');
var _ = require('lodash'),
    _a = require('async'),
    ui = require('./ui.js'),
    downloader = require('./downloader');

if (process.argv.length < 3) {
    console.log("Pass video url/id as arguments".red.bold);
    ui.stop();
} else {
    var ids = _(process.argv)
        .drop(2)
        .map(function (str) {
            var m = str.match(/(?:.*watch?.*v=)?([a-zA-Z0-9_-]{11})/);
            return m ? m[1] : null;
        })
        .filter(function (e) { return !!e })
        .value();

    _a.map(ids, function (id, callback) {
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
