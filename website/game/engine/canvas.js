/*
	Canvas rendering setup
	This file prepares the html canvas for rendering.
*/
import { Render } from "./render.js";

// Get a reference to the canvas element
const canvas = document.getElementById("game-canvas");
const canvasContainer = document.getElementById("canvas-container");
let ctx; //canvas.getContext("2d")

// Dimensions of canvas. Look at index.html to see actual dimensions
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const canvasPadding = 6;
let canvasScale = 1;

canvasContainer.style.width = canvasWidth + "px"; // Resize canvas container on load

// Get the 2D rendering context for the canvas if supported by browser
if (canvas.getContext) {
	ctx = canvas.getContext("2d"); // Use HTML5 2D rendering context (Simple, but slow and limited)
	//ctx = canvas.getContext("webgl") // Use WebGL rendering context (Complex, but fast and flexible)
	// To change the rendering backend, also go to index.html and change which render.js is loaded
} else {
	alert("Canvas is not supported in your browser.");
}

// Link the canvas to the renderer
const Draw = new Render(ctx, canvasWidth, canvasHeight);

// Function to resize the canvas based on the window size
function resizeCanvas() {
	// Get the current window dimensions & determine the scaling factor to fit the canvas within the window
	const windowWidth = document.documentElement.clientWidth;
	const windowHeight = document.documentElement.clientHeight;

	// Scale the canvas to fit within the window - "-60" accounts for navigation bar height
	const navigationBar = 60;
	const footer = 60;
	canvasScale = Math.min(1.0, Math.min((windowWidth) / (canvasWidth+canvasPadding*2), (windowHeight-navigationBar-footer) / (canvasHeight+canvasPadding*2)));
	canvasScale = Math.max(0.25, canvasScale); // Minimum scale, so it doesn't get super tiny

	// Set the canvas dimensions to fit within the window (using CSS)
	canvas.style.width = `${canvasWidth * canvasScale}px`;
	canvas.style.height = `${canvasHeight * canvasScale}px`;

	canvasContainer.style.width = `${canvasWidth * canvasScale}px`;
	canvasContainer.style.height = `${canvasHeight * canvasScale}px`;
}

// Initial canvas resize
resizeCanvas();

// Resize the canvas whenever the window size changes
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

export {canvas, ctx, canvasWidth, canvasHeight, Draw};