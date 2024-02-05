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
	let currentTextWrap = []
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
				let x = 240
				let y = 340

				// Darken surrounds
				DRAW.setColor(0,0,0,0.2)
				DRAW.rectangle(0, 0, 1024, 576, "fill")
				// Dialogue box
				DRAW.setColor(255,255,255,1)
				DRAW.image(IMG.dialogue, null, x, y)
				DRAW.setColor(0,0,0,1)
				DRAW.setFont(FONT.caption)

				let charStart = 0 // Character index from line break
				for (let i=0; i < currentTextWrap.length; i++) {
					let s = currentTextWrap[i]
					if (dialogueProgress < charStart + s.length) {
						s = s.substring(0, dialogueProgress - charStart)
					}
					DRAW.text(s, x + 30, y + 40 + i*30)

					if (s.length != currentTextWrap[i].length) {
						// line has been cut, don't continue to the next one
						break
					}
					charStart += s.length
				}

				if (dialogueProgress >= currentText.length) {
					// Draw continue prompt
					DRAW.text(">", x + 490 + promptTimer*10 + 10, y + 134)
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
			return true
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
			DRAW.setFont(FONT.caption)
			currentTextWrap = DRAW.wrapText(currentText, 550 - 30*2)
			dialogueProgress = 0
			dialogueTimer = 0
		},

		finish() {
			open = false

			d = dialogueData

			// Do any actions defined for the end of the dialogue
			if (d.startQuest) {
				// Start a quest
				QuestSystem.start(d.startQuest)
			}

			if (d.quest) {
				// Quest progress from talking
				if (d.questSlotAdd) {
					QuestSystem.progress(d.quest, d.questSlot, d.questSlotAdd)
				} else if (d,questSlotSet) {
					QuestSystem.setProgress(d.quest, d.questSlot, d.questSlotSet)
				}
			}
		}
	};
	
return functions; })()