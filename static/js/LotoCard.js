export class LotoCard {
    constructor() {
        this.grid = [];
        this.card = null;
    }

    createCard() {
        // Backround div
        const bg = document.createElement("div");
        bg.classList.add("card-background");

        // Table
        const table = document.createElement("table");
        table.classList.add("card");

        // Append table to background
        bg.appendChild(table);

        // Create 3 lines
        for (let i = 0; i < 3; i++) {
            let tr = this.createCardLine();
            table.appendChild(tr);
        }

        // Desgin card
        this.card = bg;

        // Fill card
        this.fillCard();

        return this.card;
    }

    fillCard() {
        // Create a table who handle all column possible values
        let config_colomns = [];
        config_colomns[0] = Array.from(Array(9), (_, v) => v + 1);
        for (let i = 1; i < 8; i++) {
            config_colomns[i] = Array.from(Array(10), (_, v) => v + (i*10));
        }
        config_colomns[8] = Array.from(Array(11), (_, v) => v + 80);
        // console.log("Configuration des colonnes");
        // console.log(config_colomns);

        // Create an accept config
        // A améliorer : toute les colonnes doivent être présente au final
        let config_grid = [];
        for (let i = 0; i < 3; i++) { // Colomns
            let colomns = Array.from(Array(9), (_, v) => v);
            let random_colomn = [];
            for (let j = 0; j < 5; j++) { // Lines
                let rand = this.randomIntFromInterval(0, colomns.length - 1);
                random_colomn[j] = colomns[rand];
                colomns.splice(rand, 1);
            }
            config_grid[i] = random_colomn.sort();
        }
        // console.log("Configuration de la grille");
        // console.log(config_grid);

        // Fill the grid
        let grid = [];
        for (let i = 0; i < 5; i++) { // Lines
            for (let j = 0; j < 3; j++) { // Colomns
                // Init array line
                if (i === 0) {
                    grid[j] = [];
                }
                let rand = this.randomIntFromInterval(0, config_colomns[config_grid[j][i]].length - 1);
                grid[j][i] = config_colomns[config_grid[j][i]][rand];
                config_colomns[config_grid[j][i]].splice(rand, 1);

                // Put number in card
                this.card.querySelectorAll("tr")[j].children[config_grid[j][i]].innerHTML = grid[j][i];
            }
        }
        // console.log("Grille finale");
        // console.log(grid);

        // Save grid for checking
        this.grid = grid;
    }

    createCardLine() {
        // Create line
        const tr = document.createElement("tr");

        // Create column for this line
        for (let i = 0; i < 9; i++) {
            let td = document.createElement("td");
            tr.appendChild(td);     
        }
        return tr;
    }

    checkLines(nbLines, findNumbers) {
        // Check if lines are checked
        let lineCheck = [];
        for (let i = 0; i < this.grid.length; i++) { // Lines
            let bool = true;

            for (let j = 0; j < this.grid[i].length; j++) { // Columns
                if (!findNumbers.includes(this.grid[i][j].toString())) {
                    bool = false;
                    break;
                }
            }

            if (bool) {
                lineCheck[lineCheck.length] = this.grid[i];

                if (lineCheck.length === nbLines) {
                    return {
                        bingo: true,
                        lines: lineCheck,
                    };
                }
            }
        }
        return {
            bingo: false,
        };
    }

    checkCard(goal) {
        // Get find numbers
        const checked = this.card.querySelectorAll("td.find");
        let find = [];
        for (const node of checked) {
            find[find.length] = node.innerHTML;
        }

        // Redirect in check lines
        if (goal < 3) {
            return this.checkLines(goal, find);
        }
        
        // Check if all grid numbers are find
        for (let i = 0; i < this.grid.length; i++) { // Lines
            for (let j = 0; j < this.grid[i].length; j++) { // Columns
                if (!find.includes(this.grid[i][j].toString())) {
                    return {
                        bingo: false,
                    };
                }
            }
        }
        return {
            bingo: true,
            lines: this.grid,
        };
    }

    randomIntFromInterval(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min)
    }
}