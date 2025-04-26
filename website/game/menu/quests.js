// Quests Menu
// Lists out all active quests and their steps

import {DRAW, SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "../main.js";
import {IMG, SPRITE, ANIM, FONT, ITEMS} from "../assets.js";
import {canvasWidth, canvasHeight} from "../engine/render.js";
import {Menu, MENUS} from "../menu.js";
import {Button, TextField, ColorSlider, ScrollBar} from "../gui/gui.js";
import {ItemGrid} from "../gui/itemgrid.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js";
import {openMenu, closeMenu, getOpenMenu} from "../state.js";
import {PLAYER, PLAYER_CONTROLLER} from "../world.js";
import QuestSystem from "../quests.js";
import Transition from "../transition.js";
import {requestItem, compareItems, clearItems, useItem, adoptPet} from "../items.js";

MENUS["questsMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350);
	}

	load() {
		this.openTimer = 0;

		this.buttons = {};
		this.buttons["close"] = new Button("✖", ()=>{closeMenu();}, null, 740,128, 32,32);
		
		// Quest display list
		this.listX = this.x+20; // X position of list
		this.listY = this.y+77; // Y position of list
		this.listW = this.w-40-20; // Width of list
		this.listH = this.h-110; // Height of list
		this.listEntryH = 26; // Height of each entry
		this.listScroll = 0; // Scroll position of list
		this.listDisplayLen = Math.floor(this.listH/this.listEntryH); // Number of entries that can be displayed at once
		this.list = []; // What is currently being displayed in menu (Because some quests may be expanded, or sorted out)

		// Sorting Buttons
		this.buttons["sort:all"] = new Button("All", ()=>{this.sortQuests("all");}, null, 254,148, 110,32);
		this.buttons["sort:incomplete"] = new Button("Incomplete", ()=>{this.sortQuests("incomplete");}, null, 369,148, 110,32);
		this.buttons["sort:complete"] = new Button("Complete", ()=>{this.sortQuests("complete");}, null, 484,148, 110,32);

		this.buttons["scrollBar"] = new ScrollBar(this.listX+this.listW, this.listY, 20, this.listH, 0, 100, this.listH/this.listEntryH, (scroll)=>{this.updateScroll(scroll);}, 1);
		this.buttons["scrollBar"].updateRange(0, this.list.length, null);

		this.quests = []; // Sorted quest info list
		this.sorted = "all";
		this.sortQuests(this.sorted);

		// Disable quest menu notification
		MENUS["chatMenu"].notification("quest", false);
	}

	// Sort quests by completion
	sortQuests(category) {
		this.buttons[`sort:${this.sorted}`].selected = false;
		this.sorted = category;
		this.buttons[`sort:${this.sorted}`].selected = true;
		this.quests = [];
		if (category == "all") {
			for (let questName in QuestSystem.getAllActiveQuests()) {
				this.quests.push(QuestSystem.getQuest(questName));
			}
			for (let questName in QuestSystem.getAllCompletedQuests()) {
				this.quests.push(QuestSystem.getQuestData(questName));
			}
		} else if (category == "incomplete") {
			for (let questName in QuestSystem.getAllActiveQuests()) {
				this.quests.push(QuestSystem.getQuest(questName));
			}
		} else if (category == "complete") {
			for (let questName in QuestSystem.getAllCompletedQuests()) {
				this.quests.push(QuestSystem.getQuestData(questName));
			}
		}
		// Remove all quest that are hidden AND incomplete
		for (let i=this.quests.length-1; i>=0; i--) {
			let quest = this.quests[i];
			if (quest.hidden && !quest.complete) {
				this.quests.splice(i, 1);
			}
		}
		// Sort the quests alphabetically by quest.name
		// Also, quests with the property "priority" and "complete" = false should be the first section
		// quest with "complete" = false should be in the middle section
		// and quests with "complete" = true should be at the bottom section
		// Each section should be sorted alphabetically
		this.quests.sort((a, b) => {
			if (a.priority && !a.complete) {
				if (!b.priority && b.complete) {
					return -1;
				}
				return a.name.localeCompare(b.name);
			} else if (!a.complete) {
				if (b.priority && !b.complete) {
					return 1;
				}
				if (b.complete) {
					return -1;
				}
				return a.name.localeCompare(b.name);
			} else if (a.complete) {
				if (!b.complete) {
					return 1;
				}
				return a.name.localeCompare(b.name);
			}
			return a.name.localeCompare(b.name);
		});
		this.generateList("refresh");

		// Expand all active priority quests
		for (let i=0; i<this.list.length; i++) {
			let entry = this.list[i];
			if (entry.priority && !entry.complete) {
				this.toggleQuest(entry.quest.name);
			}
		}
	}

	// Generate list of quests and progress to display
	generateList(refresh) {
		if (refresh) {
			// Create list from scratch
			this.list = [];
			let i = 0;
			for (let quest of this.quests) {
				let expandButton = new Button(quest.name, ()=>{this.toggleQuest(quest.name);}, null, this.listX, this.listY+this.listEntryH*i, this.listW, this.listEntryH);
				expandButton.labelJustify = "left";
				let entry = {
					type: "quest", // quest, progress, description
					quest: this.quests[i],
					questi: i,
					complete: quest.complete,
					priority: quest.priority,
					expanded: false,
					button: expandButton,
				};
				this.list.push(entry);
				i += 1;
			}
		} else {
			// Update existing list
			// Iterate through list and remove entries that have been collapsed or add new entries that have been expanded
			let questAppearsExpanded = false; // Does the quest entry have progress entries after it?
			for (let i=this.list.length-1; i>=0; i--) {
				let entry = this.list[i];
				if (entry.type == "quest") {
					if (questAppearsExpanded !== false) {
						// Remove collapsed entries
						if (!entry.expanded) {
							this.list.splice(i+1, questAppearsExpanded-i);
						}
					} else {
						// Add progress entries
						if (entry.expanded) {
							let quest = this.quests[entry.questi];
							let addi = i+1; // Where to add the next entry
							// Add description
							if (quest.description) {
								DRAW.setFont(FONT.caption);
								let wrappedText = DRAW.wrapText(quest.description, this.listW-20);
								for (let j=0; j<wrappedText.length; j++) {
									let descriptionEntry = {
										type: "description",
										text: wrappedText[j],
									};
									this.list.splice(addi, 0, descriptionEntry);
									addi += 1;
								}
							}
							// Add progress entries
							if (quest.progress) { // Active quest
								for (let j=0; j<quest.progress.length; j++) {
									let progressEntry = {
										type: "progress",
										text: quest.progressDescription[j],
										progress: quest.progress[j],
										progressFinish: quest.progressFinish[j],
									};
									// Check if progress description should be hidden
									if (quest.progressDescriptionSlotRequirement) {
										let requiredSlot = quest.progressDescriptionSlotRequirement[j];
										if (quest.progress[requiredSlot] < quest.progressFinish[requiredSlot]) {
											progressEntry.text = "???";
										}
									}
									// Ok, add it to list
									this.list.splice(addi, 0, progressEntry);
									addi += 1;
								}
							}
						}
					}
					questAppearsExpanded = false;
				} else {
					// Belongs to the previous quest in list
					if (questAppearsExpanded === false) {
						questAppearsExpanded = i; // This is the last entry of the expanded quest
					}
				}
			}
			// Update positions of buttons
			for (let i=0; i<this.list.length; i++) {
				let entry = this.list[i];
				if (entry.button) {
					entry.button.y = this.listY+this.listEntryH*i;
				}
			}
		}

		this.buttons["scrollBar"].updateRange(0, this.list.length, null);
	}

	// Toggle expanded state of list entry
	toggleQuest(questName) {
		// Find quest in display list with questName
		for (let i=0; i<this.list.length; i++) {
			let entry = this.list[i];
			if (entry.type == "quest" && entry.quest.name == questName) {
				entry.expanded = !entry.expanded;
				this.generateList();
				return;
			}
		}
		this.generateList();
	}

	// Scrollbar has moved. Move buttons
	updateScroll(scroll) {
		this.listScroll = scroll;

		// Move buttons
		for (let i=0; i<this.list.length; i++) {
			let entry = this.list[i];
			if (entry.button) {
				entry.button.y = this.listY+this.listEntryH*i - this.listScroll*this.listEntryH;
			}
		}
	}

	keyPress(key) {
	}

	keyRelease(key) {
	}

	mouseClick(button, x, y) {
		// Click buttons in display list
		let firstEntryi = Math.floor(this.listScroll);
		for (let i=(Math.max(0,firstEntryi)); i<Math.min(this.list.length, firstEntryi+this.listDisplayLen+1); i++) {
			let entry = this.list[i];
			if (entry.button && entry.button.click(button, x, y)) {
				return true;
			}
		}
		super.mouseClick(button, x, y);
		if (!MENUS["chatMenu"].checkMouseInside()) {
			// Disable clicking anywhere else, except for chat hud
			return true;
		}
	}

	mouseRelease(button, x, y) {
		// Release buttons in display list
		for (let i=0; i<this.list.length; i++) {
			let entry = this.list[i];
			if (entry.button && entry.button.clickRelease(button, x, y)) {
				return true;
			}
		}
		return super.mouseRelease(button, x, y);
	}
	
	draw() {
		// Window
		let scale = 1;
		if (this.openTimer < 1) {
			scale = easing("easeOutBack", this.openTimer);
		}
		DRAW.image(IMG.menu, null, this.x+this.w*0.5, this.y+this.h*0.5, 0, scale, scale, 0.5, 0.5);
		DRAW.setColor(255,255,255, scale);
		DRAW.rectangle(this.listX, this.listY, this.listW, this.listH, 1.0, 0, 0, 0, 0.5);
		DRAW.setColor(180,180,200, scale);
		DRAW.setLineWidth(4);
		DRAW.line(this.listX+2,this.listY+this.listH, this.listX+2,this.listY+2, this.listX+this.listW,this.listY+2); // Indent shadow

		// Categories
		DRAW.setColor(112, 50, 16, scale);
		DRAW.setFont(FONT.caption);
		DRAW.text("Quests:", this.x+20, this.y+35, "left");

		// Render list of quests
		let firstEntryi = Math.floor(this.listScroll);
		for (let i=(Math.max(0,firstEntryi)); i<Math.min(this.list.length, firstEntryi+this.listDisplayLen+1); i++) {
			let entry = this.list[i];
			let y = this.listY+this.listEntryH*i - this.listScroll*this.listEntryH;
			// Seperator line
			DRAW.setColor(220,220,230, scale);
			DRAW.setLineWidth(2);
			DRAW.line(this.listX+4, y+this.listEntryH, this.listX+this.listW, y+this.listEntryH);

			// Entry contents
			if (entry) {
				if (entry.type == "quest") {
					entry.button.draw();
					// Draw Checkbox
					DRAW.setColor(0, 0, 0, scale);
					DRAW.setFont(FONT.caption);
					DRAW.rectangle(this.listX+this.listW-30, y+4, 20, 19, "line");
					if (entry.complete) {
						DRAW.text("✔", this.listX+this.listW-30+10, y+20, "center");
					}
					if (entry.priority && !entry.complete) {
						DRAW.text("(!)", this.listX+this.listW-55, y+19, "left");
					}
				} else if (entry.type == "description") {
					DRAW.setColor(80, 80, 85, scale);
					DRAW.setFont(FONT.caption);
					DRAW.text(entry.text, this.listX+10, y+this.listEntryH-4, "left");
				} else {
					DRAW.setColor(0, 0, 0, scale);
					DRAW.setFont(FONT.caption);
					DRAW.text(`• ${entry.text}`, this.listX+10, y+this.listEntryH-4, "left"); // Bullet point & step
					if (entry.progress != null && entry.progressFinish != null) {
						// Draw Checkbox
						DRAW.rectangle(this.listX+this.listW-30, y+4, 20, 19, "line");
						if (entry.progress >= entry.progressFinish) {
							DRAW.text("✔", this.listX+this.listW-30+10, y+20, "center");
							//DRAW.rectangle(this.listX+this.listW-30+2, y+4+2, 20-4, 19-4, "fill") // "Checkmark"
						}
						// Debug; display as string
						//DRAW.text(entry.progress + "/" + entry.progressFinish, this.listX+this.listW-10, y+this.listEntryH-4, "right")
					}
				}
			}
		}
		DRAW.setColor(244, 188, 105, 1.0); // Cover up scrolling past list window
		//DRAW.rectangle(this.listX, this.listY-this.listEntryH, this.listW, this.listEntryH, "fill")
		//DRAW.rectangle(this.listX, this.listY+this.listH, this.listW, this.listEntryH, "fill")
		DRAW.setColor(255,255,255,1.0);
		DRAW.image(IMG.menu, [20,51, this.listW,this.listEntryH], this.listX, this.listY-this.listEntryH); // Cover top of list
		DRAW.image(IMG.menu, [20,317, this.listW,this.listEntryH], this.listX, this.listY+this.listH); // Cover bottom of list

		// Render all buttons
		this.drawButtons();
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt);
		
		// Update buttons in display list
		for (let i=0; i<this.list.length; i++) {
			let entry = this.list[i];
			if (entry.button) {
				entry.button.update(dt);
			}
		}

		this.updateButtons(dt);
	}
}();