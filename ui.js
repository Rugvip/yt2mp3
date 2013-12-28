
require('colors');
var S = require('string'),
    _ = require('lodash'),
    sprintf = require('sprintf').sprintf,
    charm = require('charm')(process);

var instances = 0;

function ProgressBar(opt) {
    this.y = instances * 2;
    ++instances;
    this.width = 50;
    this.max = opt.max;
    this.value = 0;

    for (var i = 0; i < this.y + 2; i++) {
        console.log();
    }
    charm.up(this.y + 2);

    charm.push();
    charm.down(this.y);
    charm.write(opt.title);
    charm.pop();
}

ProgressBar.prototype.tick = function (inc) {
    this.value += inc;

    if (this.value > this.max) {
        this.value = this.max;
    }

    var progress = this.value / this.max;
    var steps = progress * this.width | 0

    charm.push();
    charm.down(this.y + 1);
    charm.write('['.bold);
    charm.write(S('=').times(steps).s.bold);
    charm.right(this.width - steps);
    charm.write(']'.bold);
    charm.write(sprintf(" %6.2f%%".yellow.bold, progress * 100));
    charm.pop();

    return this.value === this.max;
};

var stop = _.once(function () {
    for (var i = 0; i < instances * 2 - 1; i++) {
        console.log();
    }
    charm.end();
});

process.on('exit', stop);

exports.ProgressBar = ProgressBar;
exports.stop = stop;
