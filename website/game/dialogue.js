// Dialogue System
// NOT the speech bubbles that apeear when when you first talk to an NPC

import {DRAW, SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "./main.js"
import {IMG, SPRITE, ANIM, FONT, SFX, ITEMS} from "./assets.js"
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "./savedata.js"
import {openMenu, closeMenu, getOpenMenu} from "./state.js"
import {PLAYER, PLAYER_CONTROLLER} from "./world.js"
import QuestSystem from "./quests.js"
import Transition from "./transition.js"
import AudioSystem from "./engine/audio.js"
import {checkCondition} from "./area.js"
import {Button, TextField, ColorSlider, ScrollBar} from "./gui/gui.js"
import { canvasWidth, canvasHeight } from "./engine/render.js"

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

	let awaitingResponse = false // Continue once reponse is chosen
	let responseButtons = [] // List of response buttons / text fields

	let serverMessage = false // This message will be built and sent to the server. Used for interacting with server through dialogue.

	const functions = {
		// Start new dialogue conversation
		start(dialogueTreeData, speakerName=false, npc=false) {
			open = true
			stage = 0 // Stage of current dialogue block
			dialogueTree = dialogueTreeData // List of dialogue blocks (not really a tree structurally)
			speaker = speakerName // Name of speaker
			speakerNPC = npc // NPC object of speaker

			serverMessage = false // Reset server message

			// Look for which dialogue block to start with
			for (let i = 0; i < dialogueTree.length; i++) {
				if (dialogueTree[i].condition) { // conditional block
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
			// Read more: https://github.com/alesan99/chicken_society/wiki/Making-Areas#dialogue

			// [{ // Dialogue block
			// 	"text": [
			//		"Line 1",
			//		"Line 2",
			//		"Line 3"
			//	],
			//	"condition": {...} // What makes condition activates this block of dialogue
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
			// Start a quest
			if (d.startQuest) {
				QuestSystem.start(d.startQuest)
			}

			// Quest progress from talking
			if (d.quest) {
				if (d.questSlotAdd) {
					QuestSystem.progress(d.quest, d.questSlot, d.questSlotAdd)
				} else if (d.questSlotSet) {
					QuestSystem.setProgress(d.quest, d.questSlot, d.questSlotSet)
				}
			}

			// Give item
			if (d.giveItem) {
				addItem(d.giveItem)
			}

			// Send a message to the server
			if (d.sendServerMessage) {
				let header = d.serverMessageHeader
				let message = serverMessage
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
			let responses = []
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
					let textField = new TextField(r.text, (text)=>{this.response(r, text)}, null, x + ((w-padding*2)/n)*i + spacing/2 + padding, y + 100 + 10, ((w-padding*2)/n)-spacing, 35)
					responseButtons.push(textField)
				} else { // Preset response
					let button = new Button(r.text, ()=>{this.response(r, r.to)}, null, x + ((w-padding*2)/n)*i + spacing/2 + padding, y + 100 + 10, ((w-padding*2)/n)-spacing, 35)
					responseButtons.push(button)
				}
			}
		},

		// Jump to next dialogue block depending on response
		response(response, nextId) {
			awaitingResponse = false
			responseButtons = []

			// Add to current server message being built
			if (response.addToServerMessage != null) {
				// console.log(`Adding to server message: ${response.addToServerMessage}`)
				let messageAddition = response.addToServerMessage
				// Check if serverMessage is an array (not object), otherwise don't do anything
				if (Array.isArray(serverMessage)) {
					serverMessage.push(messageAddition)
				} else {
					// console.log("[Dialogue] Attempted to add to server message, but message hasn't been started yet.")
					serverMessage = [messageAddition]
				}
			}

			// Finish dialogue block
			this.finish()

			// Start next dialogue block
			if (nextId == null) {
				return false
			}
			for (let i = 0; i < dialogueTree.length; i++) {
				let block = dialogueTree[i]
				if (block.id == nextId) { // Look for dialogue block with this id
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

export default DialogueSystem;