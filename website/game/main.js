let menus = []
let menu_state = ""
let menu_open = false
let gamestate = ""

PROFILE = {
    name: "Testing",
    color: "#AAAAFF",
    hat: 0,
    money: 0,
}

NETPLAY = false

// Initialize game and load assets
function gameLoad() {
    loadGameAssets()

    // Start netplay
    try {
        NETPLAY = new Netplay()
    } catch (e) {
        // Socket module wasn't loaded...
    }

    // Start world game state
    WORLD = new World("hub")
    setState(WORLD)
}

// update game logic
function gameUpdate(dt) {
    updateState(dt)

    // Is menu open?
    if (menu_open) {
        menus[menu_state].update(dt)
    }
}

// Render to canvas
function gameDraw() {
    // Clear
    ctx.save()
	ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawState()

    // Is menu open?
    if (menu_open) {
        menus[menu_state].draw()
    }
    ctx.restore()
}

// Run game loop
gameLoad()
let lastTimestamp = 0
function gameLoop(timestamp) {
    const dt = (timestamp - lastTimestamp) / 1000
    lastTimestamp = timestamp

    gameUpdate(dt)
    gameDraw()

    requestAnimationFrame(gameLoop)
}
requestAnimationFrame(gameLoop)