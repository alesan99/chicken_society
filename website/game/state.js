// State Handler; Handles which "mode" the game is currently in.
// For example: the world shouldn't update if you're playing a minigame
// Functions to interact with states
import {MENUS} from "./menu.js";
import {PLAYER_CONTROLLER} from "./world.js";

let game_state = false;
let game_state_name = "";
let open_menu = false;

function setState(state, args) {
	state.load(args);
	game_state = state;
	game_state_name = game_state.name;
}

function getState() {
	return game_state_name;
}

function stateUpdate(dt) {
	game_state.update(dt);
	// Is menu open?
	if (open_menu) {
		MENUS[open_menu].update(dt);
	}
}

function stateDraw() {
	game_state.draw();
	// Is menu open?
	if (open_menu) {
		MENUS[open_menu].draw();
	}
}

function stateKeyPress(key, code) {
	// Is menu open?
	if (open_menu) {
		if (MENUS[open_menu].keyPress(key, code)) {
			return true;
		}
	}
	if (game_state.keyPress) {
		game_state.keyPress(key, code);
	}
}
function stateKeyRelease(key, code) {
	// Is menu open?
	if (open_menu) {
		if (MENUS[open_menu].keyRelease(key, code)) {
			return true;
		}
	}
	if (game_state.keyRelease) {
		game_state.keyRelease(key, code);
	}
}

function stateMouseClick(button, x, y) {
	// Is menu open?
	if (open_menu) {
		if (MENUS[open_menu].mouseClick(button, x, y)) {
			return true;
		}
	}
	if (game_state.mouseClick) {
		game_state.mouseClick(button, x, y);
	}
}
function stateMouseRelease(button, x, y) {
	// Is menu open?
	if (open_menu) {
		if (MENUS[open_menu].mouseRelease(button, x, y)) {
			return true;
		}
	}
	if (game_state.mouseRelease) {
		game_state.mouseRelease(button, x, y);
	}
}

function stateScroll(dy) {
	// Is menu open?
	if (open_menu) {
		if (MENUS[open_menu].mouseScroll(dy)) {
			return true;
		}
	}
	if (game_state.mouseScroll) {
		game_state.mouseScroll(dy);
	}
}

// Open pop-up menu
function openMenu(name, ...args) {
	if (open_menu) {
		closeMenu();
	}
	open_menu = name;
	MENUS[name].load(...args);

	// Stop world events
	if (PLAYER_CONTROLLER) {
		// Stop moving player
		PLAYER_CONTROLLER.stop();
	}
}

function closeMenu() {
	open_menu = false;
}

function getOpenMenu() {
	if (open_menu) {
		return open_menu;
	}
	return false;
}

export {setState, getState, stateUpdate, stateDraw, stateKeyPress, stateKeyRelease, stateMouseClick, stateMouseRelease, stateScroll, openMenu, closeMenu, getOpenMenu};