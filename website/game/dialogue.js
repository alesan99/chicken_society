// Dialogue System
// NOT the speech bubbles that apeear when when you first talk to an NPC

import {SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "./main.js";
import {Draw} from "./engine/canvas.js";
import {IMG, SPRITE, ANIM, FONT, SFX, ITEMS} from "./assets.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "./savedata.js";
import {PLAYER, PLAYER_CONTROLLER} from "./world.js";
import QuestSystem from "./quests.js";
import AudioSystem from "./engine/audio.js";
import {checkCondition} from "./area.js";
import {Button, TextField, ColorSlider, ScrollBar} from "./gui/gui.js";
import { canvasWidth, canvasHeight } from "./engine/canvas.js";
import { ctx } from "./engine/canvas.js";
import {getMousePos, checkMouseInside} from "./engine/input.js";

import * as pdfjsLib from "./lib/pdf.min.mjs";
// set worker src
pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.min.js";
// set canvas
// pdfjsLib.GlobalWorkerOptions.workerPort = new Worker('./pdf.worker.min.js');

const DialogueSystem = (function() {
	let open = false; // Dialogue is open?
	let stage = 0; // Stage in dialogue sequence

	let dialogueTree = false;
	let dialogueData = false;

	let promptTimer = 0;

	let dialogueProgress = 0;
	let dialogueTimer = 0;
	let currentText = "";
	let currentTextWrap = [];
	let defaultSpeaker = false;
	let speaker = false; // Speaker name string
	let speakerIcon = false; // Speaker icon name
	let speakerNPC = false; // NPC object of speaker

	let dialogueType = false; // Type of dialogue display. False = normal, "book" = book with pages

	let awaitingResponse = false; // Continue once reponse is chosen
	let responseButtons = []; // List of response buttons / text fields

	let serverMessage = false; // This message will be built and sent to the server. Used for interacting with server through dialogue.

	// Books
	let bookPages = 1;
	let bookPage = 0; // Current page number of book
	let bookPDF = false;
	let bookLoaded = false;
	let bookCanvas1 = false;
	let bookCanvas2 = false;

	const functions = {
		// Start new dialogue conversation
		start(dialogueTreeData, speakerName=false, npc=false) {
			open = true;
			stage = 0; // Stage of current dialogue block
			dialogueTree = dialogueTreeData; // List of dialogue blocks (not really a tree structurally)
			defaultSpeaker = speakerName; // Default speaker name
			speakerNPC = npc; // NPC object of speaker
			this.setSpeaker(speakerName, true); // Default name of speaker for a dialogue block

			serverMessage = false; // Reset server message

			// Look for which dialogue block to start with
			for (let i = 0; i < dialogueTree.length; i++) {
				if (dialogueTree[i].condition) { // conditional block
					if (checkCondition(dialogueTree[i].condition)) {
						dialogueData = dialogueTree[i];
						break;
					}
				} else {
					// No condition, so always select this one
					dialogueData = dialogueTree[i];
					break;
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

			this.startText(0);

			PLAYER_CONTROLLER.stop(); // Stop player from moving
		},

		draw() {
			if (open) {
				// Darken surroundings
				Draw.setColor(0,0,0,0.2);
				Draw.rectangle(0, 0, canvasWidth, canvasHeight, "fill");

				// Dialogue Box
				if (dialogueType === false) {
					let x = 240;
					let y = 340;

					if (speaker) {
						// Move dialogue box to the right and draw speaker on the left
						x = x + 65;
						// Draw speaker icon
						if (speakerNPC) {
							Draw.setColor(255,255,255,1);
							if (speakerIcon) {
								Draw.image(speakerIcon, 0, x-140, y);
							} else {
								speakerNPC.draw(x-140 +65, y +150, "down");
							}
						} else {
							// Show mystery speaker
							Draw.setColor(255,255,255,1);
							Draw.image(IMG.speakerIcon, null, x-140 +65, y +130, 0, 1, 1, 0.5, 1.0);
						}

						Draw.setColor(255,255,255,1);
						Draw.image(IMG.dialogue, SPRITE.dialogueIcon.getFrame(0), x-140, y);
						
						// Draw speaker name
						Draw.setColor(0,0,0,1);
						Draw.setFont(FONT.caption);
						if (Draw.getTextWidth(speaker) > 128) {
							// Shrink text if name is long for name container
							Draw.setFont(FONT.nametag);
						}
						Draw.text(speaker, x-140 + 65, y+153, "center");
					}

					// Dialogue box
					Draw.setColor(255,255,255,1);
					Draw.image(IMG.dialogue, SPRITE.dialogueBox.getFrame(0), x, y);
					Draw.setColor(0,0,0,1);
					Draw.setFont(FONT.caption);

					let charStart = 0; // Character index from line break
					for (let i=0; i < currentTextWrap.length; i++) {
						let s = currentTextWrap[i];
						if (dialogueProgress < charStart + s.length) {
							s = s.substring(0, dialogueProgress - charStart);
						}
						Draw.text(s, x + 30, y + 40 + i*30);

						if (s.length != currentTextWrap[i].length) {
							// line has been cut, don't continue to the next one
							break;
						}
						charStart += s.length;
					}

					if (awaitingResponse) {
						// Draw response buttons
						for (let i = 0; i < responseButtons.length; i++) {
							let button = responseButtons[i];
							button.draw();
						}
					} else {
						if (dialogueProgress >= currentText.length) {
							// Draw continue prompt
							Draw.text(">", x + 490 + promptTimer*10 + 10, y + 134);
						}
					}
				} else if (dialogueType == "book") {
					let x = canvasWidth/2 - 680/2;
					let y = 41;

					if (bookLoaded) {
						// Render book canvases directly
						Draw.setColor(255,255,255,1.0);
						ctx.drawImage(bookCanvas1, x, y);
						ctx.drawImage(bookCanvas2, x+680/2, y);

						// Page numbers
						Draw.setColor(0,0,0,1.0);
						Draw.setFont(FONT.caption);
						Draw.text(bookPage+1, canvasWidth/2-680/4, y + 446, "center");
						Draw.text(bookPage+2, canvasWidth/2+680/4, y + 446, "center");

						// Page turn arrow
						let [mouseX, mouseY] = getMousePos();
						if (checkMouseInside(x, y, 680, 460)) {
							if (mouseX < canvasWidth/2) {
								Draw.text("<", canvasWidth/2 - 680/4 - 150, y + 446, "center");
							} else {
								Draw.text(">", canvasWidth/2 + 680/4 + 150, y + 446, "center");
							}
						}

						// Draw book texture
						Draw.setColor(255,255,255,1);
						Draw.image(IMG.book, null, x-1, y-1);
					}

				}
			}
		},

		update(dt) {
			if (open) {
				// Text animations
				if (dialogueType === false) { // normal dialogue
					if (dialogueProgress < currentText.length) {
						// Progress dialogue text character by character
						let charSpeed = 30;
						let nextChar = currentText.charAt(dialogueProgress-1);
						// pause for punctuation
						if (nextChar == "." || nextChar == "!" || nextChar == "?") {
							charSpeed = 5;
						} else if (nextChar == ",") {
							charSpeed = 8;
						}
						// progress text
						dialogueTimer += charSpeed*dt;
						let oldDialogueProgress = dialogueProgress;
						dialogueProgress = Math.min(Math.floor(dialogueTimer), currentText.length);
						// Play dialog sound
						if (speakerNPC) {
							if (dialogueProgress > oldDialogueProgress && dialogueProgress%8 == 1) {
								AudioSystem.playSound(SFX.cluck[Math.random()*SFX.cluck.length|0]);
							}
						}
					} else {
						// Continue prompt arrow movement
						promptTimer = (promptTimer + 2*dt)%1;

						// Ask for responses
						if (dialogueProgress >= currentText.length) {
							// Dialogue has finished presenting
							if (dialogueData.responses && stage >= dialogueData.text.length-1 && !awaitingResponse) {
								// Await response
								this.requestResponse(dialogueData.responses);
							}
						}
					}

					// Update response buttons
					if (awaitingResponse) {
						for (let i = 0; i < responseButtons.length; i++) {
							let button = responseButtons[i];
							button.update(dt);
						}
					}
				}
			}
		},

		keyPress(key) {
			if (!open) {
				return false;
			}

			if (awaitingResponse) {
				// Test click on all buttons
				for (let i = 0; i < responseButtons.length; i++) {
					let b = responseButtons[i];
					if (b.keyPress(key)) {
						return true;
					}
				}
			}

			// Continue
			if (dialogueType === false) {
				// Next dialogue
				if (key == " ") {
					this.next();
					return true;
				}
			} else if (dialogueType == "book") {
				// Next book page
				if (key == " " || key == "ArrowRight") {
					// Next page
					this.changeBookPage("next");
					return true;
				} else if (key == "ArrowLeft") {
					// Go back a page
					this.changeBookPage("back");
					return true;
				}
			}
			return true;
		},
	
		mouseClick(button, x, y) {
			if (!open) {
				return false;
			}

			if (awaitingResponse) {
				// Test click on all buttons
				for (let i = 0; i < responseButtons.length; i++) {
					let b = responseButtons[i];
					if (b.click(button, x, y)) {
						return true;
					}
				}
			}

			// Continue
			if (dialogueType === false) {
				// Next dialogue
				this.next();
				return true;
			} else if (dialogueType == "book") {
				// Next book page
				if (x > canvasWidth/2) {
					// Next page
					this.changeBookPage("next");
					return true;
				} else if (x < canvasWidth/2) {
					// Go back a page
					this.changeBookPage("back");
					return true;
				}
			}
			return true;
		},

		mouseRelease(button, x, y) {
			if (!open) {
				return false;
			}

			if (awaitingResponse) {
				// Release click
				for (let i = 0; i < responseButtons.length; i++) {
					let b = responseButtons[i];
					if (b.clickRelease(button, x, y)) {
						return true;
					}
				}
			}
			return false;
		},

		next() {
			// Normal dialogue
			if (dialogueProgress < currentText.length) {
				// dialogue is not finished presenting, skip
				dialogueProgress = currentText.length;
			} else if (dialogueData.responses && stage >= dialogueData.text.length-1) {
				// Await response, if applicable
				this.requestResponse(dialogueData.responses);
			} else {
				// go to next dialogue line
				stage += 1;
				if (dialogueData.randomDialogue) {
					// Random dialogue has only one stage
					this.finish();
					return;
				} if (stage >= dialogueData.text.length) {
					// No more dialogue lines, finish dialogue
					this.finish();
					return;
				}
				
				this.startText(stage);
			}
		},

		startText(i) {
			// Dialogue type
			let type = dialogueData.type;
			if (!type) {
				if (dialogueData.randomDialogue) {
					// Random dialogue has only one stage, pick any to start at
					i = Math.floor(Math.random()*dialogueData.text.length);
				}
				// Dialogue text animation
				currentText = dialogueData.text[i];
				Draw.setFont(FONT.caption);
				currentTextWrap = Draw.wrapText(currentText, 550 - 30*2); // Wrap text
				dialogueProgress = 0;
				dialogueTimer = 0;
				// Speaker
				if (dialogueData.speaker != null) {
					this.setSpeaker(dialogueData.speaker);
				} else {
					this.setSpeaker(defaultSpeaker); // Reset to default
				}
				dialogueType = false;
			} else {
				dialogueType = type;
				// Load book pop-up
				if (type == "book") {
					this.loadBook(dialogueData.file);
				}
			}
		},

		loadBook(filePath) {
			// Make a new 680x460 canvas for the pdf
			bookCanvas1 = document.createElement("canvas");
			bookCanvas1.width = 340;
			bookCanvas1.height = 460;
			bookCanvas2 = document.createElement("canvas");
			bookCanvas2.width = 340;
			bookCanvas2.height = 460;

			bookLoaded = false;
			bookPage = 0;

			// Load PDF
			pdfjsLib.getDocument({url: "./assets/" + filePath}).promise.then((pdf) => {
				bookPDF = pdf;
				bookPages = pdf.numPages;

				this.loadBookPage(bookPage);
			}).catch((error) => {
				console.error("Error loading PDF document:", error);
			});
		},

		changeBookPage(dir) {
			if (!bookLoaded) {
				// Book is still loading
				return false;
			}

			if (dir == "next") {
				bookPage += 2;
			} else if (dir == "back") {
				if (bookPage <= 0) {
					// Can't go back any further
					return false;
				}
				bookPage -= 2;
			}

			if (bookPage >= bookPages) {
				// No more pages, finish dialogue
				this.finish();
			} else {
				this.loadBookPage(bookPage);
			}
			return true;
		},

		loadBookPage(pageNo) {
			// (Actually loads a pair of pages)
			// (May get changed in the future to allow for non-book pdfs)
			bookLoaded = false;

			let bookCtx1 = bookCanvas1.getContext("2d");
			let bookCtx2 = bookCanvas2.getContext("2d");

			let x = 0;

			// Load left page
			bookPDF.getPage(pageNo+1).then((page) => {
				let transform = [1.0, 0, 0, 1.0, 0, 0];
				let desiredWidth = 340;
				let viewport = page.getViewport({ scale: 1.0, });
				let scale = desiredWidth / viewport.width;
				let scaledViewport = page.getViewport({ scale: scale, });
				let renderContext1 = {
					canvasContext: bookCtx1,
					transform: transform,
					viewport: scaledViewport
				};
				let renderContext2 = {
					canvasContext: bookCtx2,
					transform: transform,
					viewport: scaledViewport
				};
				page.render(renderContext1); // Render left page
				
				// Load right page
				bookPDF.getPage(pageNo+2).then((page2) => {
					page2.render(renderContext2); // Render right page
				}).catch((error) => {
					console.error("Error loading page 2", error);
					this.finish();
				});
				bookLoaded = true; // book is done loading when at least one page is loaded

			}).catch((error) => {
				console.error("Error loading page 1", error);
				this.finish();
			});
		},

		finish() {
			open = false;

			let d = dialogueData;

			// Do any actions defined for the end of the dialogue
			// Start a quest
			if (d.startQuest) {
				QuestSystem.start(d.startQuest);
			}

			// Quest progress from talking
			if (d.quest) {
				if (d.questTaskAdd) {
					QuestSystem.progress(d.quest, d.questTask, d.questTaskAdd);
				} else if (d.questTaskSet) {
					QuestSystem.setProgress(d.quest, d.questTask, d.questTaskSet);
				}
			}

			// Warp
			if (d.warp) {
				WORLD.warpToArea(d.warp, d.fromWarp || "dialogue", PLAYER);
			}

			// Give item
			if (d.giveItem) {
				addItem(d.giveItem);
			}

			// Send a message to the server
			if (d.sendServerMessage) {
				let header = d.serverMessageHeader;
				let message = serverMessage;
				NETPLAY.sendMessageToServer(header, message);
			}

			// Go to next dialogue block, if defined
			if (d.to) {
				this.goToDialogueBlock(d.to);
			}
		},

		// Show respnonse buttons
		requestResponse(allResponses) {
			if (awaitingResponse) {
				return false;
			}
			awaitingResponse = true;
			responseButtons = [];

			// Check which responses are available
			let responses = [];
			for (let i = 0; i < allResponses.length; i++) {
				let r = allResponses[i];
				let doAdd = true;
				if (r.condition) { // If response has condition, condition must be fulfilled
					if (!checkCondition(r.condition)) {
						doAdd = false;
					}
				}
				if (doAdd) {
					responses.push(r);
				}
			}

			// Create response buttons
			let x = 240;
			if (speaker) {
				// Draw speaker name
				x = x + 65;
			}
			let y = 340;
			let w = 550;
			let n = responses.length;
			let padding = 10;
			let spacing = 10;
			for (let i = 0; i < n; i++) {
				let r = responses[i];
				if (r.type) { // Type any response
					let textField = new TextField(r.text, (text)=>{this.response(r, text);}, null, x + ((w-padding*2)/n)*i + spacing/2 + padding, y + 100 + 10, ((w-padding*2)/n)-spacing, 35);
					responseButtons.push(textField);
				} else { // Preset response
					let button = new Button(r.text, ()=>{this.response(r, r.to);}, null, x + ((w-padding*2)/n)*i + spacing/2 + padding, y + 100 + 10, ((w-padding*2)/n)-spacing, 35);
					responseButtons.push(button);
				}
			}
		},

		// Jump to next dialogue block depending on response
		response(response, nextId) {
			awaitingResponse = false;
			responseButtons = [];

			// Add to current server message being built
			if (response.addToServerMessage != null) {
				// console.log(`Adding to server message: ${response.addToServerMessage}`)
				let messageAddition = response.addToServerMessage;
				// Check if serverMessage is an array (not object), otherwise don't do anything
				if (Array.isArray(serverMessage)) {
					serverMessage.push(messageAddition);
				} else {
					// console.log("[Dialogue] Attempted to add to server message, but message hasn't been started yet.")
					serverMessage = [messageAddition];
				}
			}

			// Finish dialogue block
			this.finish();

			// Start next dialogue block
			if (nextId == null) {
				return false;
			}
			this.goToDialogueBlock(nextId);
		},

		// Go to a different dialogue block. Used for jumping to different parts of the dialogue tree.
		goToDialogueBlock(id) {
			stage = 0; // Reset stage
			for (let i = 0; i < dialogueTree.length; i++) {
				let block = dialogueTree[i];
				if (block.id == id) { // Look for dialogue block with this id
					let doStart = true;
					// Response is telling you to go to this block, so go to it no matter what
					// if (block.condition && !checkCondition(block.condition)) {
					// 	doStart = false
					// }
					if (doStart) {
						open = true; // Open dialogue menu again
						dialogueData = dialogueTree[i];
						this.startText(0);
						return true;
					}
				}
			}
		},

		// Set speaker of current dialogue block.
		setSpeaker(name, icon=false) {
			// icon: false = no icon, true = use icon of speakerNPC, string = custom icon
			speaker = name;
			speakerIcon = icon;
		},

		getOpen() {
			return open;
		}
	};
	
	return functions; })();

export default DialogueSystem;