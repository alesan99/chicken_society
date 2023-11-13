//Functions to interact with states
let game_state = false
let game_state_name = ""
let open_menu = false

function setState(state, args) {
	state.load(args)
	game_state = state
	game_state_name = game_state.name
}

function stateUpdate(dt) {
	game_state.update(dt)
	// Is menu open?
	if (open_menu) {
		MENUS[open_menu].update(dt)
	}
}

function stateDraw() {
	game_state.draw()
	// Is menu open?
	if (open_menu) {
		MENUS[open_menu].draw()
	}
}

function stateKeyPress(key, code) {
	if (game_state.keyPress) {
		game_state.keyPress(key, code)
	}
}
function stateKeyRelease(key, code) {
	if (game_state.keyRelease) {
		game_state.keyRelease(key, code)
	}
}

function stateMouseClick(button, x, y) {
	// Is menu open?
	if (open_menu) {
		if (MENUS[open_menu].mouseClick(button, x, y)) {
			return true
		}
	}
	if (game_state.mouseClick) {
		game_state.mouseClick(button, x, y)
	}
}
function stateMouseRelease(button, x, y) {
	// Is menu open?
	if (open_menu) {
		if (MENUS[open_menu].mouseRelease(button, x, y)) {
			return true
		}
	}
	if (game_state.mouseRelease) {
		game_state.mouseRelease(button, x, y)
	}
}

function stateScroll(dy) {
	if (game_state.scroll) {
		game_state.scroll(dy)
	}
}

// Open pop-up menu
function openMenu(name) {
	if (open_menu) {
		closeMenu()
	}
	open_menu = name
	MENUS[name].load()
}

function closeMenu() {
	open_menu = false
}