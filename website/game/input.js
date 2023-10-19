// Recieve keyboard inputs
window.addEventListener("keydown", keyPressed)
window.addEventListener("keyup", keyReleased)

canvas.addEventListener("click", mouseClicked)
canvas.addEventListener("wheel", mouseScroll)

arrowKeys = {
	left: false,
	right: false,
	up: false,
	down: false
}

// Keyboard inputs
function keyPressed(event) {
	switch (event.key) {
		case "ArrowLeft":
			arrowKeys.left = true
			break
		case "ArrowUp":
			arrowKeys.up = true
			break
		case "ArrowRight":
			arrowKeys.right = true
			break
		case "ArrowDown":
			arrowKeys.down = true
			break
		default:
			stateKeyPress(event.key)
	}
}
function keyReleased(event) {
	if  (event) {
		switch (event.key) {
			case "ArrowLeft":
				arrowKeys.left = false
				break
			case "ArrowUp":
				arrowKeys.up = false
				break
			case "ArrowRight":
				arrowKeys.right = false
				break
			case "ArrowDown":
				arrowKeys.down = false
				break
			default:
				stateKeyRelease(event.key)
		}
	}
}

// Mouse inputs
// Postion; returns [x, y]
function getMousePos() {
	var pos = getMousePos(canvas, evt);
	var rect = canvas.getBoundingClientRect(), // abs. size of element
	scaleX = canvas.width / rect.width,	// relationship bitmap vs. element for x
	scaleY = canvas.height / rect.height  // relationship bitmap vs. element for y
	
	return [
		(pos.x - rect.left) * scaleX,   // scale mouse coordinates after they have
		(pos.y - rect.top) * scaleY	 // been adjusted to be relative to element
	]
}

function mouseClicked(event) {
	stateMouseClick(event.button)
}

function mouseReleased(event) {
	stateMouseRelease(event.button)
}

function mouseScroll(event) {
	const delta = event.deltaY
	return delta
}