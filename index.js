#!/usr/bin/env node

require('colors');
var _ = require('lodash'),
    _a = require('async'),
    downloader = require('./downloader');

var queue = _a.queue(downloader, 1);

process.stdin.on('data', function (data) {
    var ids = _(data.toString().split(/\n|\r| /))
        .filter(function (e) { return !!e })
        .map(function (s) {
            var m = s.match(/(?:.*watch?.*v=)?([^&]*)/);
            return m ? m[1] : null;
        }).value();

    queue.push(ids, function (err, wat) {
        if (err) {
            console.log("Video download failed: " + err);
        }
    });
});
