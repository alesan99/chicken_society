// Render module; useful functions for rendering stuff onto the screen.

const canvasWidth = 960;
const canvasHeight = 540;
const canvasPadding = 10;

// Get a reference to the canvas element
var canvas = document.getElementById("gameCanvas");

var ctx;

if (canvas.getContext) {
    // Get the 2D rendering context for the canvas
    ctx = canvas.getContext("2d");
} else {
    // Canvas not supported
    alert("Canvas is not supported in your browser.");
}

// Function to resize the canvas based on the window size
function resizeCanvas() {
    // Get the current window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Determine the scaling factor to fit the canvas within the window
    const scale = Math.min(1.0, Math.min(windowWidth / (canvasWidth+canvasPadding), windowHeight / (canvasHeight+canvasPadding)));

    // Set the canvas dimensions to fit within the window
    canvas.style.width = `${canvasWidth * scale}px`;
    canvas.style.height = `${canvasHeight * scale}px`;
}

// Initial canvas resize
resizeCanvas();

// Resize the canvas whenever the window size changes
window.addEventListener('resize', resizeCanvas);
