let menus = []
let menu_state = ""
let menu_open = false
let gamestate = ""

PROFILE = makeProfile()

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
	WORLD = new World()
	setState(WORLD, "hub")

	DRAW = new Render(ctx)
}

// update game logic
function gameUpdate(dt) {
	stateUpdate(dt)

	// Is menu open?
	if (menu_open) {
		menus[menu_state].update(dt)
	}
}

// Render to canvas
function gameDraw() {
	// Clear
	DRAW.clear(0,0,0,1)
	DRAW.push()

	stateDraw()

	// Is menu open?
	if (menu_open) {
		menus[menu_state].draw()
	}
	DRAW.pop()
}

// Run game loop
gameLoad()
let lastTimestamp = 0
function gameLoop(timestamp) {
	const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.5) // Delta time; should be capped (currently at 0.5 sec)
	lastTimestamp = timestamp

	gameUpdate(dt)
	gameDraw()

	requestAnimationFrame(gameLoop)
}
requestAnimationFrame(gameLoop)