// Main Game Loop; This is the first file that initializes the game.
var NETPLAY = false
var CURSOR = {on: false, cursor: "auto"}

var SAVEDATA = makeSaveData()
var PROFILE = SAVEDATA.profile

// Initialize game and load assets
function gameLoad() {
	DRAW = new Render(ctx)
	loadGameAssets()

	LoadingScreen.start(() => {
		// Start netplay
		NETPLAY = new Netplay()

		// Start world game state
		WORLD = new World("hub")
		setState(WORLD)

		Transition.start("fade", "in", 0.2)
	})
}

// update game logic
function gameUpdate(dt) {
	// Loading screen
	if (LoadingScreen.playing()) {
		LoadingScreen.update(dt)
		return
	}

	// Reset mouse cursor
	CURSOR.on = false

	stateUpdate(dt)

	AudioSystem.update(dt)
	Notify.update(dt)
	Transition.update(dt)

	// Set cursor at last
	let targetCursor = "auto"
	if (CURSOR.on) {
		targetCursor = "pointer"
	}
	if (CURSOR.cursor != targetCursor) {
		canvas.style.cursor = targetCursor
		CURSOR.cursor = targetCursor
	}
}

// Render to canvas
function gameDraw() {
	// Loading screen
	if (LoadingScreen.playing()) {
		LoadingScreen.draw()
		return
	}

	// Clear
	// Note: The canvas is no longer cleared. It is safe to assume there will always be a background covering up the last frame
	// DRAW.clear(0,0,0,1)
	DRAW.push()

	stateDraw()

	Notify.draw()
	Transition.draw()

	// Display FPS
	// DRAW.setColor(255,255,255,1.0)
	// DRAW.setFont(FONT.caption)
	// DRAW.text(Math.round(FPS) + " FPS",0,20)

	DRAW.pop()
}

// Run game loop
gameLoad()
let lastTimestamp = 0
function gameLoop(timestamp) {
	const dt = Math.min((timestamp - lastTimestamp) / 1000, 1/15) // Delta time; should be capped (currently at 15FPS)
	FPS = 1/((timestamp - lastTimestamp) / 1000)
	lastTimestamp = timestamp

	gameUpdate(dt)
	gameDraw()

	requestAnimationFrame(gameLoop)
}
requestAnimationFrame(gameLoop)