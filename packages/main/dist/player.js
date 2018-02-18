"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Player = (function () {
    function Player(videoElement) {
        this.videoElement = videoElement;
    }
    Player.prototype.load = function (options) {
        this.videoElement.src = options.url;
        this.videoElement.load();
        this.videoElement.play();
    };
    Player.prototype.pause = function () {
        this.videoElement.pause();
    };
    Player.prototype.resume = function () {
        this.videoElement.play();
    };
    Player.prototype.stop = function () {
        this.videoElement.src = null;
        this.videoElement.load();
    };
    Player.prototype.setPosition = function (position) {
        this.videoElement.currentTime = position;
    };
    return Player;
}());
exports.Player = Player;
//# sourceMappingURL=player.js.map