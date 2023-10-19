// Render module; useful functions for rendering stuff onto the screen.

// Get a reference to the canvas element
var canvas = document.getElementById("gameCanvas")
var ctx //canvas.getContext("2d")

// Dimensions of canvas. Look at index.html to see actual dimensions
const canvasWidth = canvas.width; const canvasHeight = canvas.height
const canvasPadding = 20
var canvasScale = 1

const container = document.getElementById("canvasContainer")
container.style.width = canvasWidth + "px"


// Get the 2D rendering context for the canvas if supported by browser
if (canvas.getContext) {
	ctx = canvas.getContext("2d")
} else {
	alert("Canvas is not supported in your browser.")
}

// Function to resize the canvas based on the window size
function resizeCanvas() {
	// Get the current window dimensions & determine the scaling factor to fit the canvas within the window
	const windowWidth = window.innerWidth
	const windowHeight = window.innerHeight
	canvasScale = Math.min(1.0, Math.min(windowWidth / (canvasWidth+canvasPadding), windowHeight / (canvasHeight+canvasPadding)))

	// Set the canvas dimensions to fit within the window (using CSS)
	canvas.style.width = `${canvasWidth * canvasScale}px`
	canvas.style.height = `${canvasHeight * canvasScale}px`
}

// Initial canvas resize
resizeCanvas()

// Resize the canvas whenever the window size changes
window.addEventListener('resize', resizeCanvas)
