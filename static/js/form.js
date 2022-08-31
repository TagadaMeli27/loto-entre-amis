window.addEventListener("load", () => {
    // Connect to socket
    const socket = io();

    // Clear session informations
    sessionStorage.clear();

    // Get all needed dom nodes
    const form_container = document.querySelectorAll("div.form-container");
    const clear_input_text = document.querySelectorAll("i.fa-circle-xmark");
    const btn_room_create = document.querySelector("button#room_create");
    const btn_room_join = document.querySelector("button#room_join");
    const btn_join = document.querySelector("#join");
    const room_name = document.querySelector("input#room");
    const player_name = document.querySelector("input#player");
    const join_warning_span = document.querySelectorAll("span.warning")[0];
    const create_warning_span = document.querySelectorAll("span.warning")[1];
    const check_limited = document.querySelector("input#limited");
    const input_time = document.querySelector("input#time");
    const btn_create = document.querySelector("#create");

    /**
     * Toggle active class of form-container
     */
    function toggleForm() {
        for (const div of form_container) {
            div.classList.toggle("active");
        }
    }

    /**
     * Clear input
     */
    function clearInputText() {
        this.parentNode.children[1].value = "";
    }

    /**
     * Check join form
     */
    function checkJoinForm() {
        // Vérifie les inputs
        if (player_name.value != "" && room_name.value != "") {

            // Envoie les infos au serveur pour vérifications
            socket.emit("form:join", {
                player: player_name.value,
                room: room_name.value,
            });
        }
        else {
            // Les champs sont mal remplis
            join_warning_span.innerHTML = "Veuillez remplir tous les champs.";
        }
    }

    /**
     * Check create form
     */
    function checkCreateForm() {
        // Récupère les infos des inputs
        let player_name = document.querySelector("input#player_name").value;
        let carton = document.querySelector("input#cartons").value;
        let mode = document.querySelector("select#modes").value;
        let limited = check_limited.checked;

        // Vérifie les inputs
        if (player_name != "" && carton != 0 && (0 <= mode < 4)) {
            // Clear session informations
            sessionStorage.clear();

            // Envoie les infos au serveur pour vérifications
            socket.emit("form:create", {
                player: player_name,
                carton: carton,
                mode: mode,
                limited: limited,
                time: time,
            });
        }
        else {
            // Les champs sont mal remplis
            create_warning_span.innerHTML = "Veuillez indiquer votre pseudo et un nombre de cartons entre 1 et 6.";
        }
    }

    // Switch forms
    btn_room_create.addEventListener("click", toggleForm);
    btn_room_join.addEventListener("click", toggleForm);

    // For each clear btn, clear text on click
    for (const clear_btn of clear_input_text) {
        clear_btn.addEventListener("click", clearInputText);
    }

    // Toggle visibility of input limited time when click on checkbox time
    check_limited.addEventListener("click", () => input_time.parentNode.classList.toggle("disabled"));

    // Check and send value on join click
    btn_join.addEventListener("click", checkJoinForm);
    
    // Check and send value on create click
    btn_create.addEventListener("click", checkCreateForm);

    // Check enter input to validate forms
    document.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            // Join form
            if (form_container[0].classList.contains("active")) {
                checkJoinForm();
            }
            // Create form
            else {
                checkCreateForm();
            }
        }
    });

    // Reception of server events
    socket.on("form:approve", (id) => {
        // Save to session storage
        sessionStorage.setItem("player", id.player);
        sessionStorage.setItem("room", id.room);
        
        // Redirect to the game
        location.assign(location.origin + "/game");
    });

    socket.on("form:error", (error) => {
        // Error message on join form
        if (error === "Session innexistante") {
            room_name.focus();
        }
        else {
            player_name.focus();
        }
        join_warning_span.innerHTML = error;
    })
});