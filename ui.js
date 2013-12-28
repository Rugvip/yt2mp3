
require('colors');
var S = require('string'),
    sprintf = require('sprintf').sprintf,
    charm = require('charm')(process);

var instances = 0;

process.on('exit', stop);

function ProgressBar(opt) {
    this.y = instances * 2;
    ++instances;
    this.width = 50;
    this.max = opt.max;
    this.value = 0;

    charm.push();
    charm.down(this.y);
    charm.write(sprintf('%s'.red.bold, opt.title));
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
    charm.write('['.blue.bold);
    charm.write(S('='.green.bold).times(steps).s);
    charm.right(this.width - steps);
    charm.write(']'.blue.bold);
    charm.write(sprintf(" %6.2f%%".yellow.bold, progress * 100));
    charm.pop();

    return this.value === this.max;
};

function stop() {
    charm.position(0, instances * 2);
    charm.end();
}

exports.ProgressBar = ProgressBar;
exports.stop = stop;
