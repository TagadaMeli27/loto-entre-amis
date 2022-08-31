import ClientPlayer from "./ClientPlayer.js";
const player = new ClientPlayer();

window.addEventListener("load", () => {
    // Connect to socket
    const socket = io();

    // Check connection
    socket.on("connect", () => {
        let player_name = sessionStorage.getItem("player");
        let room_name = sessionStorage.getItem("room");

        player.create(player_name, room_name);

        socket.emit("user:connect", {
            player: player.name,
            room: player.room,
        });
    });

    // Recieve game infos
    const plateau = document.querySelector("#plateau");
    socket.on("user:game", (room) => {
        console.log(room);
        // Les infos de la game
        document.querySelector("span#session-name").innerHTML = player.room;
        document.querySelector("span#player-name").innerHTML = player.name;
        document.querySelector("span#session-time").innerHTML = room.isLimited ? "Temps limité" : "Temps illimité";
        document.querySelector("span#session-cartons").innerHTML = room.nbCartons + " Carton" + plurial(room.nbCartons);
        
        // Players informations
        updatePlayersList(room.players);

        // Create cards
        player.setCards(room.nbCartons, plateau);

        // Get all cases in all card
        let cases = document.querySelectorAll("td");

        // Toggle cases's token on click
        for (const element of cases) {
            element.addEventListener("click", toggleFind);
        }
        
        // Others informations
        player.setGoal(room.goal);
        updateGoal();
        
        player.round = room.round;
        updateRound();
    });

    // Redirect user
    socket.on("user:redirect", () => {
        // Redirection
        location.assign(location.origin);
    });

    // Wait because game is already running
    const wait_modal = document.querySelector("#wait-modal");
    socket.on("user:wait", () => {
        wait_modal.classList.add("active-modal");
    });

    // Emit click on ready button
    const ready_button = document.querySelector("#ready");
    ready_button.addEventListener("click", () => {
        ready_button.classList.toggle("btn-active");
        if (ready_button.classList.contains("btn-active")) {
            socket.emit("user:ready");
        }
        else {
            socket.emit("user:unready");
        }
    });

    // A user is ready
    socket.on("room:ready", (user) => {
        player.friends[user].ready();
    });

    // A user is unready
    socket.on("room:unready", (user) => {
        player.friends[user].unready();
    });

    // New drawn
    const number_container = document.querySelector("#number");
    socket.on("loto:drawn", (number) => {
        number_container.classList.remove("zoom");
        number_container.innerHTML = number;
        player.resetReadyFriends();
        setTimeout(() => {
            number_container.classList.add("zoom");
            ready_button.classList.remove("btn-active");
        }, 100);
    });

    // Emit click on bingo to verifications
    const bingo_button = document.querySelector("#bingo");
    bingo_button.addEventListener("click", () => {
        bingo_button.classList.add("btn-active");
        let result = player.checkCards();
        if (result.bingo) {
            socket.emit("user:bingo", result.lines);
        }
        else {
            bingo_button.classList.remove("btn-active");
            console.log("Il y a une erreur là :(");
        }
        // Si c'est pas bon bah pas la peine d'envoyer au serveur ou alors en "fake bingo"
    });

    // Someone win
    const win_modal = document.querySelector("#win-modal");
    const win_message = document.querySelector("#win-message");
    socket.on("loto:win", (user) => {
        if (wait_modal.classList.contains("active-modal")) return;

        bingo_button.classList.remove("btn-active");
        if (user === player.name) {
            win_message.innerHTML = "Vous avez gagné !";

            // Add a victory
            player.victory++;
            updateVictory();
        }
        else {
            win_message.innerHTML = user + " a gagné !";
        }
        win_modal.classList.add("active-modal");
    });

    // Click on replay button
    const replay_button = document.querySelector("#replay");
    replay_button.addEventListener("click", () => {
        socket.emit("user:replay");
    });

    // On reset game
    socket.on("loto:reset", (playingList) => {
        // Change cards
        player.updateCards(plateau);

        // Change color of cards
        let choice = document.querySelector(".active-color");
        player.switchCardColor(choice.classList.item(1));

        // Get all cases in all card
        let cases = document.querySelectorAll("td");

        // Toggle cases's token on click
        for (const element of cases) {
            element.addEventListener("click", toggleFind);
        }

        // Update round
        player.round++;
        updateRound();

        // Update users wait
        player.playersUnWait(playingList);

        // Hide number drawn to reset
        number_container.classList.remove("zoom");

        // Remove modals
        win_modal.classList.remove("active-modal");
        wait_modal.classList.remove("active-modal");
    });

    // Callback toggle class
    function toggleFind() {
        this.classList.toggle("find");
    }

    // Update goal
    const goal_container = document.querySelector("#goal");
    function updateGoal() {
        goal_container.innerHTML = player.getGoal();
    }
    socket.on("loto:goal", (goal) => {
        player.setGoal(goal);
        updateGoal();
    });

    // Update Round
    const round_container = document.querySelector("#player-round");
    function updateRound() {
        round_container.innerHTML = player.round;
    }

    // Update Victory
    const victory_container = document.querySelector("#player-victory");
    function updateVictory() {
        victory_container.innerHTML = player.victory;
    }

    // Update players list
    const session_players_container = document.querySelector("#session-players");
    const friends_container = document.querySelector("#friends-container");
    function updatePlayersList(list, playingList) {
        session_players_container.innerHTML = list.length + " joueur" + plurial(list.length);

        player.updateFriends(list, playingList, friends_container);
    }
    socket.on("room:user", (list, playingList) => {
        updatePlayersList(list, playingList);
    });

    // Add plurial
    function plurial(counter) {
        return counter > 1 ? "s" : "";
    }

    // Toggle player settings
    const settings_modal = document.querySelector("#settings-modal");
    const player_settings = document.querySelector("#player-setting");
    player_settings.addEventListener("click", () => {
        settings_modal.classList.add("active-modal");
    });

    const cancel_settings = document.querySelector("#cancel-settings");
    cancel_settings.addEventListener("click", () => {
        settings_modal.classList.remove("active-modal");
    });

    const apply_settings = document.querySelector("#apply-settings");
    apply_settings.addEventListener("click", () => {
        // Check la couleur sélectionée et l'appliquer
        let choice = document.querySelector(".active-color");
        player.switchCardColor(choice.classList.item(1));

        settings_modal.classList.remove("active-modal");
    });

    // Switch color settings
    const colors = document.querySelectorAll("#settings-modal .square");
    function switchColorSettings() {
        for (const color of colors) {
            color.classList.remove("active-color");
        }

        this.classList.add("active-color");
    }

    for (const color of colors) {
        color.addEventListener("click", switchColorSettings);
    }
});