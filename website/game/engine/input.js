// Input Handler; This passes user inputs to the game with useful functions

import {canvas} from "./canvas.js";
import {stateKeyPress, stateKeyRelease, stateMouseClick, stateMouseRelease, stateScroll} from "../state.js";

// Recieve keyboard inputs
window.addEventListener("keydown", keyPressed);
window.addEventListener("keyup", keyReleased);

// Recieve mouse inputs
canvas.addEventListener("mousedown", mouseClicked);
canvas.addEventListener("mouseup", mouseReleased);
canvas.addEventListener("wheel", mouseScroll);
document.addEventListener("mousemove", mouseMoved);

// Recieve touch inputs
canvas.addEventListener("touchstart", touchStart);
canvas.addEventListener("touchend", touchEnd);
canvas.addEventListener("touchmove", touchMoved);

// Keyboard inputs
function keyPressed(event) {
	if (event.target.tagName.toLowerCase() === "input") {
		// Input field is focused, allow default action
		return;
	}
	event.preventDefault();
	if (event.repeat) {
		// Ignore repeated key presses when holding down key
		return;
	}
	stateKeyPress(event.key, event.code);
}
function keyReleased(event) {
	if (event.target.tagName.toLowerCase() === "input") {
		// Input field is focused, allow default action
		return;
	}
	event.preventDefault();
	if (event.repeat) {
		// Ignore repeated key presses when holding down key
		return;
	}
	stateKeyRelease(event.key, event.code);
}

// Mouse inputs
let mouseScreenX = 0;
let mouseScreenY = 0;
function convertMouseCoordsToScreen(mouseX, mouseY) {
	var rect = canvas.getBoundingClientRect(); // abs. size of element
	let scaleX = canvas.width / rect.width;	// relationship bitmap vs. element for x
	let scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y
	
	let screenX = Math.max(0, Math.min(canvas.width, (mouseX - rect.left) * scaleX));   // scale mouse coordinates after they have
	let screenY = Math.max(0, Math.min(canvas.height, (mouseY - rect.top) * scaleY));	 // been adjusted to be relative to element
	return [screenX, screenY];
}

function mouseMoved(event) {
	event.preventDefault();
	var pos = [event.clientX, event.clientY];
	
	[mouseScreenX, mouseScreenY] = convertMouseCoordsToScreen(pos[0], pos[1]);
}

// Postion; returns [x, y]
function getMousePos() {
	return [mouseScreenX, mouseScreenY];
}

function mouseClicked(event) {
	event.preventDefault();
	let [x, y] = getMousePos();
	stateMouseClick(event.button, x, y);
}

function mouseReleased(event) {
	let [x, y] = getMousePos();
	stateMouseRelease(event.button, x, y);
}

function mouseScroll(event) {
	const dy = event.deltaY;
	stateScroll(dy);
}

function checkMouseInside(x, y, w, h) {
	// Check if mouse is inside a box
	return ((mouseScreenX > x) && (mouseScreenX < x+w) && (mouseScreenY > y) && (mouseScreenY < y+h));
}

// Handle touches. Convert one touch to a mouse input
function convertTouchCoordsToScreen(mouseX, mouseY) {
	var rect = canvas.getBoundingClientRect(); // abs. size of element
	let scaleX = canvas.width / rect.width;	// relationship bitmap vs. element for x
	let scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y
	
	let screenX = Math.max(0, Math.min(canvas.width, (mouseX - rect.left) * scaleX));   // scale mouse coordinates after they have
	let screenY = Math.max(0, Math.min(canvas.height, (mouseY - rect.top) * scaleY));	 // been adjusted to be relative to element
	return [screenX, screenY];
}

let touchX = 0;
let touchY = 0;
function touchStart(event) {
	var touch = event.touches[0];
	[mouseScreenX, mouseScreenY] = convertTouchCoordsToScreen(touch.clientX, touch.clientY);

	stateMouseClick(0, mouseScreenX, mouseScreenY);
	event.preventDefault();
}
function touchEnd(event) {
	stateMouseRelease(0, mouseScreenX, mouseScreenY);
}
function touchMoved(event) {
	event.preventDefault();
	var touch = event.touches[0];
	[mouseScreenX, mouseScreenY] = convertTouchCoordsToScreen(touch.clientX, touch.clientY);
}

export {getMousePos, checkMouseInside};