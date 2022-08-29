export class Friends {
    constructor() {
        this.container = null;
        this.avatar = null;
    }

    createFriend(name) {
        // Friends container
        const friends = document.createElement("div");
        friends.classList.add("friends");

        // Friends avatar
        this.avatar = document.createElement("div");
        this.avatar.classList.add("friends-avatar");

        // Friends plateau
        // const plateau = document.createElement("div");
        // plateau.classList.add("friends-plateau");

        // Dans le plateau
        // <span class="progress">1</span>

        // Friends pseudo
        const pseudo = document.createElement("div");
        pseudo.classList.add("friends-pseudo");
        let text = document.createTextNode(name);
        pseudo.appendChild(text);

        // Append elements to friends container
        friends.append(this.avatar, pseudo);

        this.container = friends;
    }
}