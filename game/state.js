// State handler; 

class State {
	constructor (name) {
		this.name = name
	}
}


var game_state = ""
function setState(state) {
	state.load()
	game_state = state.name
}