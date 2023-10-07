// Render module; useful functions for rendering stuff onto the screen.

const canvasWidth = 960;
const canvasHeight = 540;

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