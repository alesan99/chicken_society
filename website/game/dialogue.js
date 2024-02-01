// Dialogue System
// NOT the speech bubbles that apeear when when you first talk to an NPC

const DialogueSystem = (function() {
	let open = false // Dialogue is open?
	let stage = 0 // Stage in dialogue sequence

	let dialogueTree = false
	let dialogueData = false

	let promptTimer = 0

	let dialogueProgress = 0
	let dialogueTimer = 0
	let currentText = ""
	let speaker = ""

	const functions = {
		// Start new dialogue conversation
		start(dialogueTree, speaker) {
			open = true
			stage = 0
			dialogueTree = dialogueTree

			for (let i = 0; i < dialogueTree.length; i++) {
				if (dialogueTree[i].condition) {
					if (checkCondition(dialogueTree[i].condition)) {
						dialogueData = dialogueTree[i]
						break
					}
				} else {
					// No condition, so always select this one
					dialogueData = dialogueTree[i]
					break
				}
			}

			// dialogue data structure:

			// {
			// 	"text": []
			// }

			this.startText(0)
		},

		draw() {
			if (open) {
				// Darken surrounds
				DRAW.setColor(0,0,0,0.2)
				DRAW.rectangle(0, 0, 1024, 576, "fill")
				// Dialogue box
				DRAW.setColor(255,255,255,1)
				DRAW.rectangle(300, 350, 600, 140, "fill")
				DRAW.setColor(0,0,0,1)
				DRAW.setFont(FONT.caption)
				DRAW.text(currentText.substring(0, dialogueProgress), 300 + 10, 350 + 30)

				if (dialogueProgress >= currentText.length) {
					// Draw continue prompt
					DRAW.text(">", 850 + promptTimer*10 + 10, 470)
				}
			}
		},

		update(dt) {
			if (open) {
				if (dialogueProgress < currentText.length) {
					dialogueTimer += 30*dt
					dialogueProgress = Math.min(Math.floor(dialogueTimer), currentText.length)
				} else {
					promptTimer = (promptTimer + 2*dt)%1
				}
			}
		},

		keyPress(key) {
			if (!open) {
				return false
			}

			if (key == " ") {
				this.next()
				return true
			}
			return false
		},
	
		mouseClick(button, x, y) {
			if (!open) {
				return false
			}

			this.next()
			return true
		},

		next() {
			if (dialogueProgress < currentText.length) {
				// dialogue is not finished presenting, skip
				dialogueProgress = currentText.length
			} else {
				// go to next dialogue line
				stage += 1
				if (stage >= dialogueData.text.length) {
					this.finish()
					return
				}
				
				this.startText(stage)
			}
		},

		startText(i) {
			currentText = dialogueData.text[i]
			dialogueProgress = 0
			dialogueTimer = 0
		},

		finish() {
			open = false

			// Do any actions defined for the end of the dialogue
			if (dialogueData.startQuest) {
				// Start a quest
				QuestSystem.start(dialogueData.startQuest)
			}
		}
	};
	
return functions; })()