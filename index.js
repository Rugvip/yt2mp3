var _ = require('lodash');
var _a = require('async');
var ytdl = require('./ytdl');
require('colors');

var queue = _a.queue(ytdl, 1);

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
