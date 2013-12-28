var fs = require('fs');
var request = require('request');
var _a = require('async');
var ProgressBar = require('progress');
require('colors');

var BASE_SERVICE_URL = 'http://www.youtube-mp3.org';
var BASE_YT_URL = "http://www.youtube.com/watch?v=";

function pushItem(videoId, cb) {
    request.get({
        url: BASE_SERVICE_URL + '/a/pushItem/',
        qs: {
            item: BASE_YT_URL + videoId,
            el: 'na',
            bf: 'false'
        },
        headers: {
            Host: "www.youtube-mp3.org",
            Referer: "http://www.youtube-mp3.org/"
        }
    }, function (err, res, body) {
        if (err) {
            cb(err);
        } else if (!body) {
            cb({error: "Empty push response"});
        } else {
            cb(null, body);
        }
    });
}

function itemInfo(videoId, cb) {
    request.get({
        url: BASE_SERVICE_URL + '/a/itemInfo/',
        qs: {
            video_id: videoId,
            ac: 'www',
            t: 'grp'
        }
    }, function (err, res, body) {
        if (err) {
            cb(err);
        } else {
            var match = body.match(/^info = (.*);$/);
            if (!match) {
                cb({error: "Invalid response: " + body});
            } else {
                var info = JSON.parse(match[1]);

                info.videoId = videoId;

                delete info.progress_speed;
                delete info.progress;
                delete info.status;
                delete info.pf;
                delete info.ads;
                delete info.length;

                cb(null, info);
            }
        }
    });
}

function download(info, cb) {
    var now = (new Date).getTime();

    var req = request({
        url: BASE_SERVICE_URL + '/get',
        qs: {
            ab: 256,
            video_id: info.videoId,
            h: info.h,
            r: now + "." + adler32(info.videoId + now)
        }
    });

    delete info.h;

    req.on('response', function (res) {
        console.log("Downloading '" + info.title + "'");

        if (res.headers['content-type'] === 'application/octet-stream') {
            var output = fs.createWriteStream(info.title + ".mp3");

            res.pipe(output);

            var length = parseInt(res.headers['content-length'], 10);

            var bar = new ProgressBar('[:bar] :percent :etas', {
                complete: '=',
                incomplete: ' ',
                width: 40,
                total: length
            });

            res.on('data', function (chunk) {
                bar.tick(chunk.length);
            });

            output.on('finish', function () {
                console.log("Successfully downloaded '" + info.title + "'");

                cb(null, info);
            });

            output.on('error', function (err) {
                console.error("Failed to download '" + info.title + "' (" + err + ")");

                cb(err);
            });
        } else {
            console.error("Failed to start downloading '" + info.title + "' (" + err + ")");

            cb({error: "Failed to start download"});
        }
    });
}

function adler32(str) {
    var a = 1, b = 0;

    for (i = 0; i < str.length; i++) {
        a = (a + str.charCodeAt(i)) % 65521;
        b = (b + a) % 65521;
    }

    return b << 16 | a;
}

module.exports = _a.compose(download, itemInfo, pushItem);
