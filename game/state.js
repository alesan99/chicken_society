//Functions to interact with states
let game_state = false
let game_state_name = ""
function setState(state) {
	state.load()
	game_state = state
	game_state_name = game_state.name
}

function updateState(dt) {
	game_state.update(dt)
}

function drawState() {
	game_state.draw()
}