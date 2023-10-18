//Functions to interact with states
let game_state = false
let game_state_name = ""
function setState(state) {
	state.load()
	game_state = state
	game_state_name = game_state.name
}

function stateUpdate(dt) {
	game_state.update(dt)
}

function stateDraw() {
	game_state.draw()
}

function stateKeyPress(key) {
	if (game_state.keyPress) {
		game_state.keyPress(key)
	}
}
function stateKeyRelease(key) {
	if (game_state.keyRelease) {
		game_state.keyRelease(key)
	}
}