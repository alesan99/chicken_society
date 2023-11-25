// Button grid; Imagine the inventory from minecraft
class GridSelector {
	// Callback function, x pos, y pos, cell width, cell height, grid width, grid height
    constructor(action, list, selectedFunc, drawFunc, x, y, cw=56, ch=56, gw, gh) {
        this.visible = true;
        this.action = action;

		this.list = list

		this.selectedFunc = selectedFunc // Which item in grid is selected?

		this.drawFunc = drawFunc // What to render in each cell

        this.x = x;
        this.y = y;

		// Size of grid cells
		this.cw = cw
		this.ch = ch

		// Number of cells in grid
		this.gw = gw
		this.gh = gh

		// Total size
        this.w = cw*gw;
        this.h = ch*gh;

		// Which cell is mouse over
		this.overx = 0
		this.overy = 0

		// Vertical scroll
		this.scroll = 0

        this.hover = false;
        this.holding = false;
    }

    checkMouseInside(){
        let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
        if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
			// Get selected grid cell
			let cx = Math.floor((mouseX-this.x)/this.cw)
			let cy = Math.floor((mouseY-this.y)/this.ch)
            return [cx, cy];
        }
        return [false, false];
    }
    update(dt){
        let [cx, cy] = this.checkMouseInside();
        if (cx !== false && cy !== false) {
			if (!this.holding) {
				this.overx = cx
				this.overy = cy
			}

			this.hover = true
            CURSOR.on = true;
		} else {
			this.hover = false
		}
    }

    click(){
        let [cx, cy] = this.checkMouseInside();
        if (cx !== false && cy !== false) {
			this.overx = cx
			this.overy = cy
            this.holding = true
            return true
        }
    }
    clickRelease(){
        if (this.holding == true){
            this.holding = false;
			this.gridAction(this.overx, this.overy)
        }
    }

	gridAction(cx, cy){
		let i = cx + (cy+this.scroll)*this.gw // Index of cell
		if (this.list[i]) {
			this.action(this.list[i]);
		}
	}

    draw(){
		// Render all grid cells
        let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
		
		DRAW.setColor(242, 242, 242, 1); // Light color for other cells
		DRAW.rectangle(this.x, this.y, this.w, this.h);

		for (let cx = 0; cx < this.gw; cx++) {
			for (let cy = 0; cy < this.gh; cy++) {
				let i = cx + (cy+this.scroll)*this.gw // Index of cell

				// Calculate the x and y position of the cell
				let cellX = this.x + cx * this.cw;
				let cellY = this.y + cy * this.ch;

				// Set the color based on whether the cell is being hovered over
				let selected = this.selectedFunc(i,this.list[i])
				let holding = (this.holding && this.overx === cx && this.overy === cy)
				let hover = (this.hover && this.overx === cx && this.overy === cy)
				if (hover || holding || selected) {
					if (holding) {
						DRAW.setColor(218, 165, 32, 1); // Dark color for selected cell (while holding
					} else if (hover) {
						DRAW.setColor(248, 222, 187, 1); // Medium color for hovered cell
					} else if (this.list[i] && selected) {
						DRAW.setColor(218, 165, 32, 1); // Dark color for selected cell
					}
					// Draw the cell
					DRAW.rectangle(cellX, cellY, this.cw, this.ch);
				}

				// Draw the cell border
				DRAW.setColor(168, 85, 38, 1);
				DRAW.rectangle(cellX, cellY, this.cw, this.ch, "line");

				// Draw item in this cell
				if (this.list[i]) {
					let [image, sprite] = this.drawFunc(i, this.list[i])
					if (image) {
						DRAW.image(image, sprite.getFrame(0,0), cellX+this.cw/2, cellY+this.ch/2, 0, 0.4, 0.4, 0.5, 0.5)
					}

					// Count of item owned
					//DRAW.setColor(0, 0, 0, 1)
					//DRAW.text(this.list[i], cellX, cellY+this.ch/2, "left")
				}
			}
		}

		// Tooltip
		if (this.hover) {
			let cx = this.overx
			let cy = this.overy
			let i = cx + (cy+this.scroll)*this.gw // Index of cell
			if (this.list[i]) {
				DRAW.setColor(0, 0, 0, 1)
				DRAW.text(this.list[i], mouseX+20, mouseY+20, "left")
			}
		}
    }
}

//need to add states
//need callbacks, click, clickRelease