const express = require('express');
const app = express();
const http = require('http')
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    maxHttpBufferSize: 1e8
});

const Room = require("./static/js/Room.js");

/**
 * Memo règles du loto
 * source : https://www.regles-de-jeux.com/regle-du-loto/
 */

const rooms = {};

// Connection uses
io.on("connection", (socket) => {

    // === Form listeners ===
    
    // Create a room    
    socket.on("form:create", (form) => {
        let new_room = new Room(form, rooms);

        // Setup new room
        rooms[new_room.id] = new_room;

        // Emit approve created room
        socket.emit("form:approve", {
            player: form.player,
            room: new_room.id,
        });
    });

    // Join a room
    socket.on("form:join", (id) => {
        if (rooms[id.room] !== undefined) {
            if (!rooms[id.room].isPlayerIncludes(id.player)) {
                // Connection acceptée !
                rooms[id.room].addPlayer(id.player);

                // Emit approve created room
                socket.emit("form:approve", {
                    player: id.player,
                    room: id.room,
                });
            }
            else {
                // Pseudo déjà pris
                socket.emit("form:error", "Pseudo déjà pris");
            }
        }
        else {
            // Session innexistante
            socket.emit("form:error", "Session innexistante");
        }
    });

    // === Game connect listeners ===

    // User connect to the game
    socket.on("user:connect", (id) => {
        // Mettre à jour le lien joueur / room
        if (rooms[id.room] !== undefined && rooms[id.room].isPlayerIncludes(id.player)) {
            // Send game infos
            socket.data.username = id.player;
            socket.data.room = id.room;
            socket.join(socket.data.room);
            socket.emit("user:game", rooms[socket.data.room]);
            
            // Check if running game
            if (!rooms[socket.data.room].addPlayingPlayer(socket.data.username)) {
                socket.emit("user:wait");
            }

            // Emit to others players that a new user has connected to the game
            socket.to(socket.data.room).emit("room:user", rooms[socket.data.room].players, rooms[socket.data.room].playingPlayers);
        }
        else {
            socket.emit("user:redirect");
        }
    });

    // === Game listerners ===

    // Users ready for new tirage
    socket.on("user:ready", () => {
        // Prevent disconnected user in the room
        if (socket.data.room === undefined || socket.data.username === undefined) {
            socket.emit("user:redirect");
            return;
        }

        // Broadcast this user is ready
        socket.to(socket.data.room).emit("room:ready", socket.data.username);

        // Add a ready player in this room and check if all ready
        if (rooms[socket.data.room].addReadyPlayer(socket.data.username)) {
            // If limited time, set an interval timer to drawn numbers
            if (rooms[socket.data.room].isLimited) {
                rooms[socket.data.room].intervalId = setInterval(() => {
                    // Draw a number
                    let number = rooms[socket.data.room].drawn();
                    number === null ? io.to(socket.data.room).emit("loto:out") : io.to(socket.data.room).emit("loto:drawn", number);
                }, rooms[socket.data.room].time);
            }

            // Draw a number
            let number = rooms[socket.data.room].drawn();
            number === null ? io.to(socket.data.room).emit("loto:out") : io.to(socket.data.room).emit("loto:drawn", number);
        }
    });

    // Users no more ready
    socket.on("user:unready", () => {
        // Prevent disconnected user in the room
        if (socket.data.room === undefined || socket.data.username === undefined) {
            socket.emit("user:redirect");
            return;
        }

        // Remove a ready player in this room
        rooms[socket.data.room].removeReadyPlayer(socket.data.username);

        // Broadcast this user is ready
        socket.to(socket.data.room).emit("room:unready", socket.data.username);
    });

    // User say bingo
    socket.on("user:bingo", (lines) => {
        // Prevent disconnected user in the room
        if (socket.data.room === undefined || socket.data.username === undefined) {
            socket.emit("user:redirect");
            return;
        }
        
        // Check if it's win
        let check = rooms[socket.data.room].checkDrawn(lines);

        if (check) {
            // Clear auto drawn
            if (rooms[socket.data.room].isLimited) {
                clearInterval(rooms[socket.data.room].intervalId);
            }

            // Emit to all players in this room that this player has win
            io.to(socket.data.room).emit("loto:win", socket.data.username);
        }
    });

    socket.on("user:replay", () => {
        // Prevent disconnected user in the room
        if (socket.data.room === undefined || socket.data.username === undefined) {
            socket.emit("user:redirect");
            return;
        }
        
        if (rooms[socket.data.room].addReplayPlayer(socket.data.username)) {
            // Reset la room
            rooms[socket.data.room].reset();
            
            // Check game mode
            if (rooms[socket.data.room].mode == 0) {
                io.to(socket.data.room).emit("loto:goal", rooms[socket.data.room].goal);
            }

            // Emit reset game
            io.to(socket.data.room).emit("loto:reset", rooms[socket.data.room].playingPlayers);
        }
    });

    socket.on("disconnect", () => {
        if (socket.data.username !== undefined && rooms[socket.data.room] !== undefined) {
            rooms[socket.data.room].removePlayer(socket.data.username);

            // Clear auto drawn
            if (rooms[socket.data.room].isLimited) {
                clearInterval(rooms[socket.data.room].intervalId);
            }

            // If empty room, delete it
            if (rooms[socket.data.room].players.length == 0) {
                delete rooms[socket.data.room];
            }
            // Else check replay, ready player and playing players
            else {
                if (rooms[socket.data.room].isAllReady()) {
                    let number = rooms[socket.data.room].drawn();
                    socket.to(socket.data.room).emit("loto:drawn", number);
                }

                if (rooms[socket.data.room].isAllReplay()) {
                    // Reset la room
                    rooms[socket.data.room].reset();
                    
                    // Check game mode
                    if (rooms[socket.data.room].mode == 0) {
                        socket.to(socket.data.room).emit("loto:goal", rooms[socket.data.room].goal);
                    }
                }

                // Todo : Si tous les joueurs en train de jouer déco bah go reset la game pour que les joueurs en attente jouent

                // Emit to others players that a user has disconnected the game
                socket.to(socket.data.room).emit("room:user", rooms[socket.data.room].players);
            }
        }
    });
});

// Application root directory
app.use(express.static(__dirname));

// Nunjucks
const nunjucks = require('nunjucks');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// Routing
app.get('/', (req, res) => {
    res.render('home.html');
});

app.get("/game", (req, res) => {
    res.render('index.html');
});

// Server
server.listen(process.env.PORT || 3000, () => {
    console.log('listening on localhost:3000');
});
