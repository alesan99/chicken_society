// Input Handler; This passes user inputs to the game with useful functions

// Recieve keyboard inputs
window.addEventListener("keydown", keyPressed)
window.addEventListener("keyup", keyReleased)

// Recieve mouse inputs
canvas.addEventListener("mousedown", mouseClicked)
canvas.addEventListener("mouseup", mouseReleased)
canvas.addEventListener("wheel", mouseScroll)
document.addEventListener("mousemove", mouseMoved)

// Recieve touch inputs
canvas.addEventListener("touchstart", touchStart)
canvas.addEventListener("touchend", touchEnd)
canvas.addEventListener("touchmove", touchMoved)
// Prevent scrolling when touching the canvas
// document.body.addEventListener("touchstart", function (e) { if (e.target == canvas) { e.preventDefault(); }}, false)
// document.body.addEventListener("touchend", function (e) {if (e.target == canvas) { e.preventDefault(); }}, false)
// document.body.addEventListener("touchmove", function (e) { if (e.target == canvas) { e.preventDefault(); }}, false)

// Keyboard inputs
function keyPressed(event) {
	event.preventDefault()
	stateKeyPress(event.key, event.code)
}
function keyReleased(event) {
	event.preventDefault()
	stateKeyRelease(event.key, event.code)
}

// Mouse inputs
let mouseScreenX = 0
let mouseScreenY = 0
function convertMouseCoordsToScreen(mouseX, mouseY) {
	var rect = canvas.getBoundingClientRect() // abs. size of element
	let scaleX = canvas.width / rect.width	// relationship bitmap vs. element for x
	let scaleY = canvas.height / rect.height  // relationship bitmap vs. element for y
	
	let screenX = Math.max(0, Math.min(canvas.width, (mouseX - rect.left) * scaleX))   // scale mouse coordinates after they have
	let screenY = Math.max(0, Math.min(canvas.height, (mouseY - rect.top) * scaleY))	 // been adjusted to be relative to element
	return [screenX, screenY]
}

function mouseMoved(event) {
	var pos = [event.clientX, event.clientY];
	
	[mouseScreenX, mouseScreenY] = convertMouseCoordsToScreen(pos[0], pos[1])
}

// Postion; returns [x, y]
function getMousePos() {
	return [mouseScreenX, mouseScreenY]
}

function mouseClicked(event) {
	let [x, y] = getMousePos()
	stateMouseClick(event.button, x, y)
}

function mouseReleased(event) {
	let [x, y] = getMousePos()
	stateMouseRelease(event.button, x, y)
}

function mouseScroll(event) {
	const delta = event.deltaY
	return delta
}

// Handle touches. Convert one touch to a mouse input
function convertTouchCoordsToScreen(mouseX, mouseY) {
	var rect = canvas.getBoundingClientRect() // abs. size of element
	let scaleX = canvas.width / rect.width	// relationship bitmap vs. element for x
	let scaleY = canvas.height / rect.height  // relationship bitmap vs. element for y
	
	let screenX = Math.max(0, Math.min(canvas.width, (mouseX - rect.left) * scaleX))   // scale mouse coordinates after they have
	let screenY = Math.max(0, Math.min(canvas.height, (mouseY - rect.top) * scaleY))	 // been adjusted to be relative to element
	return [screenX, screenY]
}

let touchX = 0
let touchY = 0
function touchStart(event) {
	var touch = event.touches[0];
	[mouseScreenX, mouseScreenY] = convertTouchCoordsToScreen(touch.clientX, touch.clientY)

	stateMouseClick(0, mouseScreenX, mouseScreenY)
}
function touchEnd(event) {
	stateMouseRelease(0, mouseScreenX, mouseScreenY)
}
function touchMoved(event) {
	var touch = event.touches[0];
	[mouseScreenX, mouseScreenY] = convertTouchCoordsToScreen(touch.clientX, touch.clientY)
}