// Recieve keyboard inputs
window.addEventListener("keydown", keyPressed)
window.addEventListener("keyup", keyReleased)

canvas.addEventListener("mousedown", mouseClicked)
canvas.addEventListener("mouseup", mouseReleased)
canvas.addEventListener("wheel", mouseScroll)

document.addEventListener("mousemove", mouseMoved);

// Keyboard inputs
function keyPressed(event) {
	event.preventDefault()
	stateKeyPress(event.key)
}
function keyReleased(event) {
	event.preventDefault()
	stateKeyRelease(event.key)
}

// Mouse inputs
let mouseScreenX = 0
let mouseScreenY = 0
function convertMouseCoordsToScreen(mouseX, mouseY) {
	var rect = canvas.getBoundingClientRect(), // abs. size of element
	scaleX = canvas.width / rect.width,	// relationship bitmap vs. element for x
	scaleY = canvas.height / rect.height  // relationship bitmap vs. element for y
	
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