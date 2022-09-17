class Room {
    constructor(form, roomList) {
        this.players = [form.player];
        this.nbCartons = form.carton;
        this.mode = form.mode;
        this.isLimited = form.limited;
        this.time = parseInt(form.time) * 1000;
        this.intervalId = null;
        this.id = this.generateRoomId(6);
        this.round = 1;
        this.readyPlayers = [];
        this.replayPlayers = [];
        this.playingPlayers = [];

        if (this.mode != 0) {
            this.goal = parseInt(this.mode);
        }
        else {
            this.goal = 1;
        }

        // Loto session informations
        this.loto = Array.from(Array(90), (_, v) => v + 1); // All tirable numbers
        this.lastNumber = null;

        // Avoid having multiple rooms with same id
        while (roomList[this.id] !== undefined) {
            this.id = this.generateRoomId(6);
        }
    }

    isPlayerIncludes(player) {
        return this.players.includes(player);
    }

    addPlayer(player) {
        this.players[this.players.length] = player;
    }

    removePlayer(player) {
        this.players = this.players.filter(element => element != player);

        if (this.replayPlayers.includes(player)) {
            this.removeReplayPlayer(player);
        }

        if (this.readyPlayers.includes(player)) {
            this.removeReadyPlayer(player);
        }

        if (this.playingPlayers.includes(player)) {
            this.playingPlayers = this.playingPlayers.filter(element => element != player);
        }
    }

    addPlayingPlayer(player) {
        if (this.loto.length === 90) {
            this.playingPlayers[this.playingPlayers.length] = player;
            return true;
        }

        return false;
    }

    addReadyPlayer(player) {
        if (!this.readyPlayers.includes(player)) {
            this.readyPlayers[this.readyPlayers.length] = player;
        }

        return this.isAllReady();
    }

    removeReadyPlayer(player) {
        this.readyPlayers = this.readyPlayers.filter(element => element != player);
    }

    isAllReady() {
        return this.readyPlayers.length === this.playingPlayers.length;
    }

    addReplayPlayer(player) {
        if (!this.replayPlayers.includes(player)) {
            this.replayPlayers[this.replayPlayers.length] = player;
        }

        return this.isAllReplay();
    }

    removeReplayPlayer(player) {
        this.replayPlayers = this.replayPlayers.filter(element => element != player);
    }

    isAllReplay() {
        return this.replayPlayers.length === this.playingPlayers.length;
    }

    drawn() {
        this.readyPlayers = [];
        if (this.loto.length > 0) {
            let rand = this.randomIntFromInterval(0, this.loto.length - 1);
            let number = this.loto[rand];
            this.lastNumber = number;
            this.loto.splice(rand, 1);
            return number;
        }
        return null;
    }

    checkDrawn(lines) {
        let haveLastNumber = false;
        for (const line of lines) {
            if (line.includes(this.lastNumber)) {
                haveLastNumber = true;
                break;
            }
        }
        
        if (!haveLastNumber) {
            return false;
        }

        for (const line of lines) {
            for (const number of line) {
                if (this.loto.includes(number)) {
                    return false;
                }
            }
        }
        return true;
    }

    reset() {
        this.loto = Array.from(Array(90), (_, v) => v + 1); // All tirable numbers
        this.lastNumber = null;
        this.round++;

        if (this.mode == 0) {
            this.goal = this.goal < 3 ? ++this.goal : 1;
        }

        this.playingPlayers = this.players;
        this.readyPlayers = [];
        this.replayPlayers = [];
    }

    generateRoomId(length) {
        let result = "";
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.random() * characters.length);
        }
        return result;
    }

    randomIntFromInterval(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min)
    }
}

module.exports = Room;