const canvasWidth = 960;
const canvasHeight = 540;

// Get a reference to the canvas element
var canvas = document.getElementById("gameCanvas");

if (canvas.getContext) {
    // Get the 2D rendering context for the canvas
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Set the font and text color
    ctx.font = "30px Arial";
    ctx.fillStyle = "blue";
    ctx.fillText("Hello, World!", 50, 100);
} else {
    // Canvas not supported
    alert("Canvas is not supported in your browser.");
}