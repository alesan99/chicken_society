import { CURSOR } from "../main.js";
import { Draw } from "../engine/canvas.js";
import { FONT } from "../assets.js";
import { getMousePos } from "../engine/input.js";
import { ToolTip } from "./tooltip.js";

class Button {
	constructor(label="", action=()=>{}, graphic, x=0, y=0, w, h, tooltip=null) { //in px, label is text on button, action is function to call when clicked
		this.visible = true;
		this.label = label;
		this.labelJustify = "center";

		this.textColor = [112, 50, 16];
		this.rotation = 0;

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
			if (graphic.labelJustify) {
				this.labelJustify = graphic.labelJustify;
			}
			if (graphic.textColor) {
				this.textColor = graphic.textColor;
			}
			if (graphic.rotation) {
				this.rotation = graphic.rotation;
			}
		}
		this.action = action;

		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.hover = false;
		this.held = false;
		this.selected = false;
		this.disabled = false;
		this.actionOnClick = false; // action performed on click, not release

		if (tooltip) {
			this.tooltip = new ToolTip(tooltip, this.x+this.w/2, this.y, this);
		}
	}

	checkMouseInside(){
		let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
		if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
			return true;
		}
		return false;
	}
	update(dt){
		if (this.disabled) {
			// Don't update if button is disabled
			return false;
		}

		this.hover = this.checkMouseInside();
		if (this.hover) {
			CURSOR.on = true; // Show finger cursor
		}

		if (this.tooltip) {
			this.tooltip.update(dt);
		}
	}

	click(button, x, y){
		if (this.tooltip) {
			this.tooltip.click();
		}

		this.hover = this.checkMouseInside();
		if (this.hover) {//this should only click if you're hovering over the button
			this.held = true;
			if (!this.disabled && this.actionOnClick) {
				this.action(); // Don't wait for click release (useful where input delay matters)
			}
			return true; // ignore all other buttons
		}
	}
	clickRelease(button, x, y){
		if (this.held == true){
			this.held = false;
			if (!this.disabled && !this.actionOnClick) {
				this.action();
			}
		}
	}

	draw(alpha){
		if (!this.visible) {
			// Don't render if button was specified to be not visible
			return false;
		}

		if (this.image) {
			// Render image for button
			let frame = 0;
			if (this.held == true){
				frame = 2;
			} else if (this.hover == true){
				frame = 1;
			}
			Draw.setColor(255,255,255,alpha);
			Draw.image(this.image,this.frames[frame], this.x+this.w/2, this.y+this.h/2, this.rotation, 1,1, 0.5,0.5);
		} else {
			// Render button with basic rectangles if no image was provided
			if (this.disabled == true) {
				Draw.setColor(208,125,68,alpha); //darkest
			} else if (this.held == true){
				Draw.setColor(216,151,91,alpha); //dark
			} else if (this.hover == true){
				Draw.setColor(248,222,187,alpha); //medium
			} else if (this.selected == true){
				Draw.setColor(242,161,99,alpha); //dark
			} else {
				Draw.setColor(242,199,140,alpha); //light
			}
			
			Draw.rectangle(this.x, this.y, this.w, this.h);
			Draw.setColor(168, 85, 38, alpha);
			Draw.setLineWidth(2);
			Draw.rectangle(this.x+1, this.y+1, this.w-2, this.h-2, "line");

			Draw.setColor(255,255,255, alpha*0.4);
			Draw.line(this.x+3, this.y+4, this.x+this.w-3, this.y+4); // Highlight
		}

		if (this.icon) {
			// Icon
			Draw.setColor(255,255,255,alpha);
			Draw.image(this.icon,this.iconFrame, this.x+this.w/2, this.y+this.h/2, 0, 1,1, 0.5,0.5);
		} else if (this.label) {
			// Label
			Draw.setFont(FONT.guiLabel);
			Draw.setColor(this.textColor[0], this.textColor[1], this.textColor[2],alpha);
			if (this.labelJustify == "center") {
				Draw.text(this.label, this.x+this.w/2, this.y+this.h/2+7, this.labelJustify);
			} else if (this.labelJustify == "left") {
				Draw.text(this.label, this.x+10, this.y+this.h/2+7, this.labelJustify);
			} else if (this.labelJustify == "right") {
				Draw.text(this.label, this.x+this.w-10, this.y+this.h/2+7, this.labelJustify);
			}
		}

		if (this.tooltip) {
			this.tooltip.draw();
		}
	}
}

// TextField
// Lets you type text
class TextField extends Button {
	constructor(text="", textAction=(text)=>{}, graphic, x=0, y=0, w, h) {
		super("", ()=>{}, null, x, y, w, h);

		this.textAction = textAction;

		this.text = text; // text being edited
		this.typing = false; // can user type?

		this.cursor = text.length; // index of where to edit texxt

		this.blinkTimer = 0; // blinking cursor animation
	}

	draw() {
		if (this.held == true){
			Draw.setColor(214,214,230,1); //dark
		} else if (this.hover == true){
			Draw.setColor(255,255,255,1); //medium
		} else {
			Draw.setColor(245,245,246,1); //light
		}
		
		Draw.rectangle(this.x, this.y, this.w, this.h);
		Draw.setColor(90,90,110, 1);
		Draw.setLineWidth(2);
		Draw.rectangle(this.x+1, this.y+1, this.w-2, this.h-2, "line");

		Draw.setColor(255,255,255, 0.4);
		Draw.line(this.x+3, this.y+this.h-4, this.x+this.w-3, this.y+this.h-4); // Highlight

		// Text input
		Draw.setFont(FONT.guiLabel);
		Draw.setColor(10,10,14,1);
		let text = this.text;

		Draw.text(text, this.x+10, this.y+this.h/2+7, "left");
		
		// Cursor
		if (this.typing && this.blinkTimer < 0.5) {
			// Show cursor only when typing
			let cursorX = this.x + 10 + Draw.getTextWidth(text.slice(0, this.cursor)) - 2;
			Draw.text("|", cursorX, this.y+this.h/2+5, "left");
		}
	}

	update(dt) {
		this.blinkTimer = (this.blinkTimer + dt)%1;
		super.update(dt);
	}

	keyPress(key) {
		if (key == "Enter") {
			// Enter text
			if (this.textAction) {
				this.textAction(this.text);
				this.typing = false;
			}
			return true;
		} else if (key == "Backspace") {
			// Remove text (from cursor location)
			if (this.text.length > 0 && this.cursor > 0) {
				this.text = this.text.slice(0, this.cursor-1) + this.text.slice(this.cursor);
				this.cursor = Math.max(0, this.cursor - 1);
				this.blinkTimer = 0;
			}

			return true;
		} else if (key == "ArrowLeft") {
			// Move cursor left
			this.cursor = Math.max(0, this.cursor - 1);
			this.blinkTimer = 0;
		} else if (key == "ArrowRight") {
			// Move cursor right
			this.cursor = Math.min(this.text.length, this.cursor + 1);
			this.blinkTimer = 0;
		} else if (key.length === 1) {
			// Add text
			Draw.setFont(FONT.guiLabel);
			let textWidth = Draw.getTextWidth(this.text + key);
			if (textWidth < this.w-20) { // Only add character if it fits within box
				// Insert character at cursor location
				this.text = this.text.slice(0, this.cursor) + key + this.text.slice(this.cursor);

				this.cursor = this.cursor + 1;
				this.blinkTimer = 0;
			}
			return true;
		}
	}

	keyRelease(key) {

	}
	
	click() {
		super.click();
		if (this.hover) {
			this.typing = true;
			this.blinkTimer = 0;

			// Find cursor location
			this.cursor = this.text.length;
			let [mouseX, mouseY] = getMousePos();
			let mouseRX = mouseX - this.x - 10; // Relative x
			let text = this.text;
			Draw.setFont(FONT.guiLabel);
			let segW = 0; // Width of current segment (left-to-right)
			for (let i=0; i<=text.length; i++) {
				// Okay, we go through every single letter of the text in the box
				let charW = Draw.getTextWidth(text[i]);
				segW += charW;
				// At each letter, we see if the mouse is behind the middle point of the letter
				// If it is, the cursor is put behind that letter
				// Otherwise, the next letter will perform the same check
				if (mouseRX < (segW-(charW/2))) {
					this.cursor = i;
					break;
				}
			}
			return true;
		} else {
			if (this.typing && this.textAction) {
				this.textAction(this.text);
			}
			this.typing = false;
		}
	}

	clickRelease() {
		super.clickRelease();
		if (!this.hover) {
			// Lazy hack
			// Allows field to be unselected when a different button is pressed
			if (this.typing && this.textAction) {
				this.textAction(this.text);
			}
			this.typing = false;
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
		this.upButton = new Button("▲", ()=>{this.scrollButton(-this.scrollStep);}, null, this.x, this.y, this.buttonSize, this.buttonSize);
		this.downButton = new Button("▼", ()=>{this.scrollButton(this.scrollStep);}, null, this.x, this.y+this.h-this.buttonSize, this.buttonSize, this.buttonSize);

		this.barOriginY = this.y+this.buttonSize;
		this.barTotalRange = this.h-this.buttonSize*2;
		this.bar = new Button(null, ()=>{}, null, this.x, this.barOriginY, this.w, this.h-this.buttonSize*2);
		this.barClickX = 0;
		this.barClickY = 0;

		this.scroll = 0;

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
		if (this.bar.held) {
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
		Draw.setColor(168, 85, 38, 1);
		Draw.rectangle(this.x, this.y+this.buttonSize, this.w, this.h-this.buttonSize*2, "fill");

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
		return this.upButton.click() || this.downButton.click();
	}
	clickRelease(button, x, y){
		return this.upButton.clickRelease() || this.downButton.clickRelease() || this.bar.clickRelease();
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

// Color selector
class ColorSlider {
	constructor(x=0, y=0, w=100, h=20, value=0, minValue=0, maxValue=1, colorFunc=(value)=>{}, updateFunc=(value)=>{}, setFunc=(value)=>{}) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.colorFunc = colorFunc; // Used to determine color at any value (For display purposes)
		this.updateFunc = updateFunc; // Called when slider is held down
		this.setFunc = setFunc; // Called when slider is released

		this.renderColors = true,

		// convert value (minValue to maxValue) to a value between 0 and 1
		this.value = (value-minValue)/(maxValue-minValue); // 0-1
		this.oldRealValue = value;
		this.minValue = minValue;
		this.maxValue = maxValue;
	}

	checkMouseInside(){
		let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
		if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
			return true;
		}
		return false;
	}

	click(button, x, y){
		if (this.checkMouseInside()) {
			this.held = true;
			return true;
		}
	}

	clickRelease(button, x, y){
		if (this.held) {
			this.held = false;

			let realValue = this.minValue + this.value*(this.maxValue-this.minValue);
			this.setFunc(realValue);
		}
	}

	update(dt){
		this.hover = this.checkMouseInside();

		if (this.held) {
			// Update color selection
			let [mouseX, mouseY] = getMousePos();
			let newValue = Math.min(1, Math.max(0, (mouseX-this.x)/this.w)); // 0-1
			this.value = newValue;
			let realValue = this.minValue + this.value*(this.maxValue-this.minValue); // minValue-maxValue
			if (realValue != this.oldRealValue) { // Only call update func if value changed
				this.updateFunc(realValue);
				this.oldRealValue = realValue;
			}
		}
	}

	draw() {
		if (this.renderColors) {
			// Background
			Draw.setColor(168, 85, 38, 1);
			Draw.rectangle(this.x, this.y, this.w, this.h, "fill");
			// brute force a gradient
			for (let i=0; i<this.w; i++) {
				let color = this.colorFunc(i/this.w);
				Draw.setColor(color[0], color[1], color[2], 1);
				Draw.rectangle(this.x+i, this.y, 1, this.h, "fill");
			}
		}

		// Slider
		Draw.setColor(255,255,255,1);
		Draw.rectangle(this.x+this.w*this.value -2, this.y, 4, this.h, "line");
	}
}

export {Button, TextField, ScrollBar, ColorSlider};