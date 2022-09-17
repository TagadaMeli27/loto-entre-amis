import { Friends } from "./Friends.js";
import { LotoCard } from "./LotoCard.js";

export default class ClientPlayer {
    constructor() {
        this.name = null;
        this.room = null;
        this.round = null;
        this.victory = 0;
        this.goal = null;
        this.timeIsLimited = null;
        this.cards = [];
        this.friends = {};
    }

    create(name, room) {
        this.name = name;
        this.room = room;
    }

    setGoal(goal) {
        this.goal = goal;
    }

    getGoal() {
        switch (this.goal) {
            case 1:
                return "Objectif 1 ligne";

            case 2:
                return "Objectif 2 lignes";
        
            default:
                return "Objectif carton plein";
        }
    }

    setCards(nbCartons, parent) {
        for (let i = 0; i < nbCartons; i++) {
            this.cards[i] = new LotoCard();
            this.cards[i].createCard();
            // Voir un moyen de save si reconnection
            parent.appendChild(this.cards[i].card);
        }
    }

    updateCards(parent) {
        let numberCards = this.cards.length;
        this.cards = [];

        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }

        this.setCards(numberCards, parent);
    }

    checkCards() {
        for (const card of this.cards) {
            let check = card.checkCard(this.goal);
            if (check.bingo) {
                return {
                    bingo: true,
                    lines: check.lines,
                };
            }
        }
        return {
            bingo: false,
        };
    }

    switchCardColor(color) {
        for (const card of this.cards) {
            // Remove color classes
            card.card.classList.remove("blue");
            card.card.classList.remove("green");
            card.card.classList.remove("yellow");
            card.card.classList.remove("orange");
            card.card.classList.remove("pink");

            if (color != "red") card.card.classList.add(color);
        }
    }

    updateFriends(list, playingList, parent) {
        if (Object.keys(this.friends).length === 0) {
            for (const player of list) {
                if (player != this.name) {
                    this.addFriend(player, parent);
                    this.isPlayerPlaying(player, playingList);
                }
            }
        }
        else {
            // A new player has connected
            if (list.length > Object.keys(this.friends).length) {
                for (const player of list) {
                    if (this.friends[player] === undefined && player != this.name) {
                        this.addFriend(player, parent);
                        this.isPlayerPlaying(player, playingList);
                        break;
                    }
                }
            }
            // A player has disconnected
            else {
                for (const player in this.friends) {
                    if (!list.includes(player) && player != this.name) {
                        parent.removeChild(this.friends[player].container);
                        delete this.friends[player];
                        break;
                    }
                }
            }
        }
    }

    isPlayerPlaying(player, playingList) {
        if (playingList === undefined) return;

        if (!playingList.includes(player)) {
            this.friends[player].wait();
        }
        else {
            this.friends[player].unwait();
        }
    }

    playersUnWait(list) {
        for (const player of list) {
            if (player != this.name) {
                this.friends[player].unwait();
            }
        }
    }

    addFriend(player, parent) {
        let friend = new Friends();
        friend.createFriend(player);
        parent.appendChild(friend.container);
        this.friends[player] = friend;
    }

    resetReadyFriends() {
        for (const [_, friend] of Object.entries(this.friends)) {
            friend.unready();
        }
    }
}