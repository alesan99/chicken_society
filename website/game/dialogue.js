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
	let speaker = false
	let speakerNPC = false

	let awaitingResponse = false
	let responseButtons = []

	const functions = {
		// Start new dialogue conversation
		start(dialogueTreeData, speakerName=false, npc=false) {
			open = true
			stage = 0
			dialogueTree = dialogueTreeData
			speaker = speakerName
			speakerNPC = npc

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

			// [{ // Dialogue block
			// 	"text": [
			//		"Line 1",
			//		"Line 2",
			//		"Line 3"
			//	],
			//  "randomDialogue": false, // Randomly select a line from the text array
			//	"condition": { // What makes condition activates this block of dialogue
			//		"quest": "tutorial",
			//		"questSlot": 0,
			//		"questSlotValue": 0
			//	},
			// },
			// {...}] // More dialogue blocks

			this.startText(0)

			PLAYER_CONTROLLER.stop() // Stop player from moving
		},

		draw() {
			if (open) {
				let x = 240
				let y = 340

				// Darken surrounds
				DRAW.setColor(0,0,0,0.2)
				DRAW.rectangle(0, 0, canvasWidth, canvasHeight, "fill")

				if (speaker) {
					// Draw speaker name
					x = x + 65
					// DRAW.setColor(120,250,120,1)
					// DRAW.rectangle(x-140 +16, y+16, 100,100, "fill")
					if (speakerNPC) {
						DRAW.setColor(255,255,255,1)
						if (speakerNPC.icon) {
							DRAW.image(icon, 0, x-140, y)
						} else {
							speakerNPC.draw(x-140 +65, y +150, "down")
						}
					}

					DRAW.setColor(255,255,255,1)
					DRAW.image(IMG.dialogue, SPRITE.dialogueIcon.getFrame(0), x-140, y)
					
					DRAW.setFont(FONT.caption)
					DRAW.setColor(0,0,0,1)
					DRAW.text(speaker, x-140 + 65, y+153, "center")
				}

				// Dialogue box
				DRAW.setColor(255,255,255,1)
				DRAW.image(IMG.dialogue, SPRITE.dialogueBox.getFrame(0), x, y)
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

				if (awaitingResponse) {
					// Draw response buttons
					for (let i = 0; i < responseButtons.length; i++) {
						let button = responseButtons[i]
						button.draw()
					}
				} else {
					if (dialogueProgress >= currentText.length) {
						// Draw continue prompt
						DRAW.text(">", x + 490 + promptTimer*10 + 10, y + 134)
					}
				}
			}
		},

		update(dt) {
			if (open) {
				// Text animations
				if (dialogueProgress < currentText.length) {
					dialogueTimer += 30*dt
					dialogueProgress = Math.min(Math.floor(dialogueTimer), currentText.length)
				} else {
					// Continue prompt arrow movement
					promptTimer = (promptTimer + 2*dt)%1

					// Ask for responses
					if (dialogueProgress >= currentText.length) {
						// Dialogue has finished presenting
						if (dialogueData.responses && stage >= dialogueData.text.length-1 && !awaitingResponse) {
							// Await response
							this.requestResponse(dialogueData.responses)
						}
					}
				}

				// Update response buttons
				if (awaitingResponse) {
					for (let i = 0; i < responseButtons.length; i++) {
						let button = responseButtons[i]
						button.update(dt)
					}
				}
			}
		},

		keyPress(key) {
			if (!open) {
				return false
			}

			if (awaitingResponse) {
				// Test click on all buttons
				for (let i = 0; i < responseButtons.length; i++) {
					let b = responseButtons[i]
					if (b.keyPress(key)) {
						return true
					}
				}
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

			if (awaitingResponse) {
				// Test click on all buttons
				for (let i = 0; i < responseButtons.length; i++) {
					let b = responseButtons[i]
					if (b.click(button, x, y)) {
						return true
					}
				}
			}

			this.next()
			return true
		},

		mouseRelease(button, x, y) {
			if (!open) {
				return false
			}

			if (awaitingResponse) {
				// Release click
				for (let i = 0; i < responseButtons.length; i++) {
					let b = responseButtons[i]
					if (b.clickRelease(button, x, y)) {
						return true
					}
				}
			}
			return false
		},

		next() {
			if (dialogueProgress < currentText.length) {
				// dialogue is not finished presenting, skip
				dialogueProgress = currentText.length
			} else if (dialogueData.responses && stage >= dialogueData.text.length-1) {
				// Await response, if applicable
				this.requestResponse(dialogueData.responses)
			} else {
				// go to next dialogue line
				stage += 1
				if (dialogueData.randomDialogue) {
					// Random dialogue has only one stage
					this.finish()
					return
				} if (stage >= dialogueData.text.length) {
					this.finish()
					return
				}
				
				this.startText(stage)
			}
		},

		startText(i) {
			if (dialogueData.randomDialogue) {
				// Random dialogue has only one stage, pick any to start at
				i = Math.floor(Math.random()*dialogueData.text.length)
			}
			currentText = dialogueData.text[i]
			DRAW.setFont(FONT.caption)
			currentTextWrap = DRAW.wrapText(currentText, 550 - 30*2)
			dialogueProgress = 0
			dialogueTimer = 0
		},

		finish() {
			open = false

			let d = dialogueData

			// Do any actions defined for the end of the dialogue
			if (d.startQuest) {
				// Start a quest
				QuestSystem.start(d.startQuest)
			}

			if (d.quest) {
				// Quest progress from talking
				if (d.questSlotAdd) {
					QuestSystem.progress(d.quest, d.questSlot, d.questSlotAdd)
				} else if (d.questSlotSet) {
					QuestSystem.setProgress(d.quest, d.questSlot, d.questSlotSet)
				}
			}

			if (d.giveItem) {
				// Give item
				addItem(d.giveItem)
			}

			if (d.sendToServer) {
				// Send a message to the server
				let header = d.serverHeader
				let message = d.serverMessage
				NETPLAY.sendMessageToServer(header, message)
			}
		},

		// Show respnonse buttons
		requestResponse(allResponses) {
			if (awaitingResponse) {
				return false
			}
			awaitingResponse = true
			responseButtons = []

			// Check which responses are available
			responses = []
			for (let i = 0; i < allResponses.length; i++) {
				let r = allResponses[i]
				let doAdd = true
				if (r.condition) { // If response has condition, condition must be fulfilled
					if (!checkCondition(r.condition)) {
						doAdd = false
					}
				}
				if (doAdd) {
					responses.push(r)
				}
			}

			// Create response buttons
			let x = 240
			if (speaker) {
				// Draw speaker name
				x = x + 65
			}
			let y = 340
			let w = 550
			let n = responses.length
			let padding = 10
			let spacing = 10
			for (let i = 0; i < n; i++) {
				let r = responses[i]
				if (r.type) { // Type any response
					let textField = new TextField(r.text, (text)=>{this.response(text)}, null, x + ((w-padding*2)/n)*i + spacing/2 + padding, y + 100 + 10, ((w-padding*2)/n)-spacing, 35)
					responseButtons.push(textField)
				} else { // Preset response
					let button = new Button(r.text, ()=>{this.response(r.to)}, null, x + ((w-padding*2)/n)*i + spacing/2 + padding, y + 100 + 10, ((w-padding*2)/n)-spacing, 35)
					responseButtons.push(button)
				}
			}
		},

		// Jump to next dialogue block depending on response
		response(responseId) {
			awaitingResponse = false
			responseButtons = []

			// Finish dialogue block
			this.finish()

			// Start next dialogue block
			if (responseId == null) {
				return false
			}
			for (let i = 0; i < dialogueTree.length; i++) {
				let block = dialogueTree[i]
				if (block.id == responseId) { // Look for dialogue block with this id
					let doStart = true
					// Response is telling you to go to this block, so go to it no matter what
					// if (block.condition && !checkCondition(block.condition)) {
					// 	doStart = false
					// }
					if (doStart) {
						open = true // Open dialogue menu again
						dialogueData = dialogueTree[i]
						this.startText(0)
						return true
					}
				}
			}
		},

		getOpen() {
			return open
		}
	};
	
return functions; })()