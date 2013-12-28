require('colors');
var fs = require('fs'),
    request = require('request'),
    _a = require('async'),
    EventEmitter = require('events').EventEmitter;

var BASE_SERVICE_URL = 'http://www.youtube-mp3.org';
var BASE_YT_URL = "http://www.youtube.com/watch?v=";

function pushItem(downloader, cb) {
    request.get({
        url: BASE_SERVICE_URL + '/a/pushItem/',
        qs: {
            item: BASE_YT_URL + downloader.videoId,
            el: 'na',
            bf: 'false'
        },
        headers: {
            Host: "www.youtube-mp3.org",
            Referer: "http://www.youtube-mp3.org/",
            'Accept-Location': '*'
        }
    }, function (err, res, body) {
        if (err) {
            cb(err);
        } else if (!body) {
            cb({error: "[" + downloader.videoId + "] Empty push response"});
        } else {
            cb(null, downloader);
        }
    });
}

function itemInfo(downloader, cb) {
    request.get({
        url: BASE_SERVICE_URL + '/a/itemInfo/',
        qs: {
            video_id: downloader.videoId,
            ac: 'www',
            t: 'grp'
        }
    }, function (err, res, body) {
        if (err) {
            cb(err);
        } else {
            var match = body.match(/^info = (.*);$/);
            if (!match) {
                if (body === 'pushItemYTError();') {
                    cb({error: "[" + downloader.videoId + "] Could not push video, video size limit is 20 min"});
                } else {
                    cb({error: "[" + downloader.videoId + "] Invalid response: " + body});
                }
            } else {
                var info = JSON.parse(match[1]);

                downloader.title = info.title.replace(/[^A-Za-z0-9\s-_\[\]\(\)\{\}\+\.\*]/g, "");
                downloader.h = info.h;

                cb(null, downloader);
            }
        }
    });
}

function download(downloader, cb) {
    var now = (new Date).getTime();

    var req = request({
        url: BASE_SERVICE_URL + '/get',
        qs: {
            ab: 256,
            video_id: downloader.videoId,
            h: downloader.h,
            r: now + "." + adler32(downloader.videoId + now)
        }
    });

    delete downloader.h;

    req.on('response', function (res) {
        if (res.headers['content-type'] === 'application/octet-stream') {
            var output = fs.createWriteStream(downloader.title + ".mp3");

            res.pipe(output);

            var length = parseInt(res.headers['content-length'], 10);

            downloader.emit('start', length);

            res.on('data', function (chunk) {
                downloader.emit('tick', chunk.length);
            });

            output.on('finish', function () {
                downloader.emit('done');
                cb(null, downloader);
            });

            output.on('error', function (err) {
                cb({error: "[" + downloader.videoId + "] Download failed: " + err});
            });
        } else {
            cb({error: "[" + downloader.videoId + "] Failed to start download"});
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

exports.startDownload = function (videoId, cb) {
    var downloader = new EventEmitter;
    downloader.videoId = videoId;

    _a.waterfall([
        function (callback) {
            callback(null, downloader);
        },
        pushItem,
        itemInfo,
        download], function (err, result) {
            if (err) {
                downloader.emit('error', err);
            }
            if (cb) {
                cb(err, result);
            }
        });

    return downloader;
};
