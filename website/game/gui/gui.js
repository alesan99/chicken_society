class Button {
	constructor(label="", action=()=>{}, graphic, x=0, y=0, w, h) { //in px, label is text on button, action is function to call when clicked  
		this.visible = true;
		this.label = label;
		this.labelJustify = "center";

		if (graphic) {
			// If specified, render image for button with frames
			if (graphic.image) {
				this.image = graphic.image;
				this.frames = graphic.frames;
			}
			if (graphic.icon) {
				this.icon = graphic.icon;
				this.iconFrame = graphic.iconFrame;
			}
			if (graphic.visible != null) {
				this.visible = graphic.visible;
			}
		}
		this.action = action;

		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.hover = false;
		this.holding = false;
		this.selected = false;
	}

	checkMouseInside(){
		let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
		if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
			return true;
		}
		return false;
	}
	update(dt){
		this.hover = this.checkMouseInside();
		if (this.hover) {
			CURSOR.on = true;
		}
	}

	click(button, x, y){
		this.hover = this.checkMouseInside();
		if (this.hover) {//this should only click if you're hovering over the button
			this.holding = true
			return true
		}
	}
	clickRelease(button, x, y){
		if (this.holding == true){
			this.holding = false;
			this.action();
		}
	}

	draw(){
		if (!this.visible) {
			// Don't render if button was specified to be not visible
			return false
		}

		if (this.image) {
			// Render image for button
			let frame = 0
			if (this.holding == true){
				frame = 2
			} else if (this.hover == true){
				frame = 1
			}
			DRAW.setColor(255,255,255,1)
			DRAW.image(this.image,this.frames[frame], this.x+this.w/2, this.y+this.h/2, 0, 1,1, 0.5,0.5)
		} else {
			// Render button with basic rectangles if no image was provided
			if (this.holding == true){
				DRAW.setColor(216,151,91,1); //dark
			} else if (this.hover == true){
				DRAW.setColor(248,222,187,1); //medium
			} else if (this.selected == true){
				DRAW.setColor(242,161,99,1); //dark
			} else {
				DRAW.setColor(242,199,140,1); //light
			}
			
			DRAW.rectangle(this.x, this.y, this.w, this.h);
			DRAW.setColor(168, 85, 38, 1)
			DRAW.setLineWidth(2)
			DRAW.rectangle(this.x+1, this.y+1, this.w-2, this.h-2, "line");

			DRAW.setColor(255,255,255, 0.4);
			DRAW.line(this.x+3, this.y+4, this.x+this.w-3, this.y+4); // Highlight
		}

		if (this.icon) {
			// Icon
			DRAW.setColor(255,255,255,1)
			DRAW.image(this.icon,this.iconFrame, this.x+this.w/2, this.y+this.h/2, 0, 1,1, 0.5,0.5)
		} else if (this.label) {
			// Label
			DRAW.setFont(FONT.guiLabel)
			DRAW.setColor(112, 50, 16,1)
			if (this.labelJustify == "center") {
				DRAW.text(this.label, this.x+this.w/2, this.y+this.h/2+7, this.labelJustify)
			} else if (this.labelJustify == "left") {
				DRAW.text(this.label, this.x+10, this.y+this.h/2+7, this.labelJustify)
			} else if (this.labelJustify == "right") {
				DRAW.text(this.label, this.x+this.w-10, this.y+this.h/2+7, this.labelJustify)
			}
		}
	}
}

// Scrollbar
class ScrollBar {
	// position x, y, size w, h, min scroll, max scroll, "visible" window of scrolling area, scroll bar movement update function
	constructor(x=0, y=0, w=20, h=100, min, max, window, updateFunc=(scroll)=>{}, scrollStep=20) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.updateFunc = updateFunc;

		this.buttonSize = this.w;
		this.scrollStep = scrollStep;
		this.upButton = new Button("^", ()=>{this.scrollButton(-this.scrollStep)}, null, this.x, this.y, this.buttonSize, this.buttonSize);
		this.downButton = new Button("V", ()=>{this.scrollButton(this.scrollStep)}, null, this.x, this.y+this.h-this.buttonSize, this.buttonSize, this.buttonSize);

		this.barOriginY = this.y+this.buttonSize;
		this.barTotalRange = this.h-this.buttonSize*2;
		this.bar = new Button(null, ()=>{}, null, this.x, this.barOriginY, this.w, this.h-this.buttonSize*2);
		this.barClickX = 0;
		this.barClickY = 0;

		this.scroll = 0

		this.updateRange(min, max, window);
	}

	checkMouseInside(){
		let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
		if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
			return true;
		}
		return false;
	}
	update(dt){
		this.hover = this.checkMouseInside();

		let [mouseX, mouseY] = getMousePos();
		if (this.bar.holding) {
			this.bar.y = Math.min(this.barOriginY+this.barRange, Math.max(this.barOriginY, (mouseY-this.barClickY)));
			let newScroll = this.min + (this.max-this.min-this.window)*(this.bar.y-this.barOriginY)/(this.barRange);
			this.updateScroll(newScroll);
		}

		// Buttons
		this.upButton.update(dt);
		this.downButton.update(dt);
		this.bar.update(dt);
	}
	draw() {
		// Scroll Range background
		DRAW.setColor(168, 85, 38, 1);
		DRAW.rectangle(this.x, this.y+this.buttonSize, this.w, this.h-this.buttonSize*2, "fill");

		// Buttons
		this.upButton.draw();
		this.downButton.draw();
		this.bar.draw();
	}

	click(button, x, y){
		if (this.bar.click()) {
			let [mouseX, mouseY] = getMousePos();
			this.barClickY = mouseY-this.bar.y;
		}
		return this.upButton.click() || this.downButton.click()
	}
	clickRelease(button, x, y){
		return this.upButton.clickRelease() || this.downButton.clickRelease() || this.bar.clickRelease()
	}
	mouseScroll(dy){
		if (dy > 0) {
			this.scrollButton(this.scrollStep);
		} else {
			this.scrollButton(-this.scrollStep);
		}
	}

	updateRange(min, max, window=null) {
		this.min = min;
		this.max = max;

		// Update scroll bar size
		if (window) {
			this.window = window;
		}
		// Like a browser, the bar size is proportional to the content size
		this.bar.h = Math.max(Math.min((this.window)/(this.max-this.min) * (this.h-this.buttonSize*2), (this.h-this.buttonSize*2)), 30);
		this.barRange = this.barTotalRange-this.bar.h;

		// Keep scroll within new range
		this.updateScroll(this.scroll);
	}

	scrollButton(amount) {
		this.updateScroll(this.scroll + amount);
	}

	updateScroll(newScroll) {
		// Keep scroll within new range
		this.scroll = newScroll || 0;
		this.scroll = Math.min(Math.max(this.min, this.max-this.window), Math.max(this.min, this.scroll));
		this.updateFunc(this.scroll);
		this.bar.y = this.barOriginY + this.barRange*(this.scroll-this.min)/(this.max-this.min-this.window);
	}
}