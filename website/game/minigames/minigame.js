// Minigame state; Runs a given minigame script while allowing the player to still chat and exit the game

class MinigameState {
	constructor() {

	}

	load(minigameName) {
		if (minigameName == "slots") {
			this.minigame = MinigameSlots
		}
        this.minigame.load()
	}

	update(dt) {
        this.minigame.update(dt)

		// HUD
		CHAT.update(dt)
	}

	draw() {
        // Render minigame contents
        this.minigame.draw()
		
		// HUD
		CHAT.draw()
	}

	// Exit minigame
	exit() {
        Transition.start("wipeLeft", "out", 0.8, null, () => {
            PLAYER.static = false
            setState(WORLD) // Go back to world
            Transition.start("wipeRight", "in", 0.8, null, null)
        })
	}

	keyPress(key) {
		// Exit minigame
		if (key == "Escape") {
            this.exit()
			return true
		}
		CHAT.keyPress(key)

		// Control minigame
        this.minigame.keyPress(key)
	}

	keyRelease(key) {
		// Control minigame
        this.minigame.keyRelease(key)
	}

	mouseClick(x, y, button) {
		// Control minigame
        this.minigame.mouseClick(x, y, button)
	}
}