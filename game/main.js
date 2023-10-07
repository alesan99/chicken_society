let menus = []
let menu_state = ""
let menu_open = false

// Initialize game assets
function gameLoad() {
    window.addEventListener("keydown", keyPressed);
    window.addEventListener("keyup", keyReleased);

    PLAYER = new Character(0, 0, 20, 40)
}

let arrowKeys = {
    left: false,
    right: false,
    up: false,
    down: false
}
function keyPressed(event) {
    // Implement your input handling logic here
    // Update player position, game state, etc.
    switch (event.key) {
        case "ArrowLeft":
            arrowKeys.left = true;
            break;
        case "ArrowUp":
            arrowKeys.up = true;
            break;
        case "ArrowRight":
            arrowKeys.right = true;
            break;
        case "ArrowDown":
            arrowKeys.down = true;
            break;
    }
}
function keyReleased(event) {
    // Implement your input handling logic here
    // Update player position, game state, etc.
    if  (event) {
        switch (event.key) {
            case "ArrowLeft":
                arrowKeys.left = false;
                break;
            case "ArrowUp":
                arrowKeys.up = false;
                break;
            case "ArrowRight":
                arrowKeys.right = false;
                break;
            case "ArrowDown":
                arrowKeys.down = false;
                break;
        }
    }
}

// update game logic
let y = 0
function gameUpdate(dt) {
    y = y + 5*dt

    let dx = 0
    let dy = 0
    if (arrowKeys.left) {
        dx += -1
    } else if (arrowKeys.right) {
        dx += 1
    }
    if (arrowKeys.up) {
        dy += -1
    } else if (arrowKeys.down) {
        dy += 1
    }
    PLAYER.move(dt, dx, dy)

    // Is menu open?
    if (menu_open) {
        menus[menu_state].update(dt)
    }
}


const image = new Image();
image.src = "assets/chicken.png"; // Replace with the actual path to your image file

// Render to canvas
function gameDraw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    
    ctx.fillStyle = "black";
    ctx.fillRect(PLAYER.x, PLAYER.y, PLAYER.w, PLAYER.h)
    const x = (canvas.width - image.width) / 2;
    const y = (canvas.height - image.height) / 2;
    ctx.drawImage(image, PLAYER.x, PLAYER.y);


    // Set the font and text color
    ctx.font = "30px Arial";
    ctx.fillStyle = "blue";
    ctx.fillText("Hello, World!", 50, y);

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