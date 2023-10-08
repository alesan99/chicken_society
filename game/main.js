let menus = []
let menu_state = ""
let menu_open = false

// Initialize game and load assets
function gameLoad() {
    loadGameAssets()
    
    PLAYER = new Character(0, 0, 120, 160)
    PLAYER_CONTROLLER = new Player(PLAYER)
}

// update game logic
function gameUpdate(dt) {
    // Update objects
    PLAYER_CONTROLLER.update(dt)

    // Is menu open?
    if (menu_open) {
        menus[menu_state].update(dt)
    }
}

// Render to canvas
function gameDraw() {
    // Clear
	ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Render objects
    ctx.fillStyle = "black";
    ctx.fillRect(PLAYER.x, PLAYER.y, PLAYER.w, PLAYER.h)
    ctx.drawImage(IMG.chicken, PLAYER.x, PLAYER.y, PLAYER.w, PLAYER.h);

    // Set the font and text color
    ctx.font = "30px Arial";
    ctx.fillStyle = "blue";
    ctx.fillText("Hello, World!", 50, 100);

    // Is menu open?
    if (menu_open) {
        menus[menu_state].draw()
    }
}

// Run game loop
gameLoad()
let lastTimestamp = 0;
function gameLoop(timestamp) {
    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    gameUpdate(dt);
    gameDraw();

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);