#!/usr/bin/env node

require('colors');
var _ = require('lodash'),
    _a = require('async'),
    downloader = require('./downloader');

var queue = _a.queue(downloader, 1);

if (process.argv.length < 3) {
    process.stdin.on('data', function (data) {
        var ids = _(data.toString().split(/\n|\r| /))
            .map(stripVideoId)
            .filter(function (e) { return !!e })
            .value();

        queue.push(ids, handleResult);
    });
} else {
    var ids = _(process.argv)
        .drop(2)
        .map(stripVideoId)
        .filter(function (e) { return !!e })
        .value();

    queue.push(ids, handleResult);
}

function stripVideoId(str) {
    var m = str.match(/(?:.*watch?.*v=)?([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

function handleResult(err, result) {
    if (err) {
        console.log("Video download failed: " + err);
    }
}
