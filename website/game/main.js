// Main Game Loop; This is the first file that initializes the game.
import {canvas, ctx} from "./engine/canvas.js"
import AudioSystem from "./engine/audio.js"
import Netplay from "./netplay/client.js"
var NETPLAY
var CURSOR = {on: false, cursor: "auto"}

import { makeSaveData } from "./savedata.js"
var SAVEDATA = makeSaveData()
var PROFILE = SAVEDATA.profile

import { Render } from "./engine/render.js"
var DRAW = {}

import { loadGameAssets } from "./assets.js"
import LoadingScreen from "./loading.js"

import { World } from "./world.js"
var WORLD

import { setState, stateUpdate, stateDraw } from "./state.js"
import Transition from "./transition.js"
import Notify from "./gui/notification.js"
import { handleUrl } from "./netplay/urls.js"

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

		// Handle special URLs
		handleUrl()
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
var FPS
function gameLoop(timestamp) {
	const dt = Math.min((timestamp - lastTimestamp) / 1000, 1/15) // Delta time; should be capped (currently at 15FPS)
	FPS = 1/((timestamp - lastTimestamp) / 1000)
	lastTimestamp = timestamp

	gameUpdate(dt)
	gameDraw()

	requestAnimationFrame(gameLoop)
}
requestAnimationFrame(gameLoop)

export { PROFILE, SAVEDATA, CURSOR, DRAW, NETPLAY, WORLD }