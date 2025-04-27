//Customize Player Menu; Menu with options to modify player profile and customize chicken

import {SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "../main.js";
import {Draw} from "../engine/canvas.js";
import {IMG, SPRITE, ANIM, FONT, ITEMS} from "../assets.js";
import {Menu, MENUS} from "../menu.js";
import {Button, TextField, ColorSlider, ScrollBar} from "../gui/gui.js";
import {ItemGrid} from "../gui/itemgrid.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js";
import {openMenu, closeMenu, getOpenMenu} from "../state.js";

MENUS["shop"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350);
	}

	// Shop configuration (from area file), buyer
	load (config, sell) {
		this.openTimer = 0;

		this.buttons = {};
		this.buttons["close"] = new Button("✖", ()=>{closeMenu();}, null, 740,128, 32,32);

		// Configure shop inventory
		this.name = config.name || "";
		this.items = config.items || {}; // {category: {itemId: true or {"items":{"priceItem":1},"nuggets":0,"count":1}}}
		this.sell = sell;
		if (this.sell) {
			this.sellPercentage = config.percentage || 0.75;
			this.items = {}; // Build new items list
			// If an item from config.items is in the player's inventory, add it to the shop as a sellable item
			for (let category in config.items) {
				this.items[category] = {};
				for (let itemId in config.items[category]) {
					let inventoryCount = getItem(itemId, category);
					if (inventoryCount) {
						this.items[category][itemId] = config.items[category][itemId]; // Set sell price
					}
				}
			}
		}
		// Shop items
		// Inventory
		this.tab = "allTab";
		this.tabType = "all";
		this.inventory = [];
		this.buttons["allTab"] = new Button("All", ()=>{this.filterInventory("all"); this.buttons[this.tab].selected=false; this.tab = "allTab"; this.buttons[this.tab].selected=true;}, null, 265,150, 46,34);
		let i = 0;
		if (this.items["head"]) { // Only enable tab if selling items in this category
			this.buttons["headTab"] = new Button("H", ()=>{this.filterInventory("head"); this.buttons[this.tab].selected=false; this.tab = "headTab"; this.buttons[this.tab].selected=true;}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(0)}, 311+34*i,150, 34,34);
			i++;
		}
		if (this.items["face"]) { // Only enable tab if selling items in this category
			this.buttons["faceTab"] = new Button("F", ()=>{this.filterInventory("face"); this.buttons[this.tab].selected=false; this.tab = "faceTab"; this.buttons[this.tab].selected=true;}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(1)}, 311+34*i,150, 34,34);
			i++;
		}
		if (this.items["body"]) { // Only enable tab if selling items in this category
			this.buttons["bodyTab"] = new Button("B", ()=>{this.filterInventory("body"); this.buttons[this.tab].selected=false; this.tab = "bodyTab"; this.buttons[this.tab].selected=true;}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(2)}, 311+34*i,150, 34,34);
			i++;
		}
		if (this.items["furniture"]) { // Only enable tab if selling items in this category
			this.buttons["furnitureTab"] = new Button("FT", ()=>{this.filterInventory("furniture"); this.buttons[this.tab].selected=false; this.tab = "furnitureTab"; this.buttons[this.tab].selected=true;}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(3)}, 311+34*i,150, 34,34);
			i++;
		}
		if (this.items["item"]) { // Only enable tab if selling items in this category
			this.buttons["itemTab"] = new Button("I", ()=>{this.filterInventory("item"); this.buttons[this.tab].selected=false; this.tab = "itemTab"; this.buttons[this.tab].selected=true;}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(4)}, 311+34*i,150, 34,34);
			i++;
		}
		if (this.items["pet"]) { // Only enable tab if selling items in this category
			this.buttons["petTab"] = new Button("I", ()=>{this.filterInventory("pet"); this.buttons[this.tab].selected=false; this.tab = "petTab"; this.buttons[this.tab].selected=true;}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(5)}, 311+34*i,150, 34,34);
			i++;
		}
		this.filterInventory("all");
		this.buttons["allTab"].selected = true;

		// Display information about selected item
		this.selectedItem = false;
		this.selectedItemType = false;
		this.selectedItemDescription = [];

		this.buttons["inventory"] = new ItemGrid(
			(itemId,itemType)=>{
				// Item to preview
				if (itemId) {
					this.selectedItemCost = this.items[itemType][itemId];
					this.selectedItem = itemId;
					this.selectedItemType = itemType;
					if (ITEMS[itemType][itemId]) { // Make sure item has been loaded
						if (ITEMS[itemType][itemId].description) {
							Draw.setFont(FONT.description);
							this.selectedItemDescription = Draw.wrapText(ITEMS[itemType][itemId].description, 200); // Pre-wrap text for performance
						} else {
							this.selectedItemDescription = false;
						}
					}
					// Enable/disable buy/sell button
					if (this.buttons["sell"]) {this.buttons["sell"].disabled = false;}
					if (this.buttons["buy"]) {
						this.buttons["buy"].disabled = false;
						if (!this.canBuyItem(itemType, itemId, this.selectedItemCost)) {
							this.buttons["buy"].disabled = true;
						}
					}
				}
			},
			this.inventory,
			(itemId,itemType,over)=>{
				// Is selected?
				if (this.selectedItem == itemId) {
					return true;
				} else if (SAVEDATA.items[itemType][itemId]) {
					return "gray";
				}
			}, 265,184, 68,68, 4,3);

		// Buy/Sell button
		if (this.sell) {
			this.buttons["sell"] = new Button("Sell", ()=>{ // Sell item
				if (this.selectedItem) {
					this.sellItem(this.selectedItemType, this.selectedItem, this.selectedItemCost, this.sellPercentage);
					let intentoryCount = getItem(this.selectedItem, this.selectedItemType);
					if (intentoryCount <= 0) { // Remove item from shop if sold out
						delete this.items[this.selectedItemType][this.selectedItem];
						this.filterInventory(this.tabType);
						this.buttons["sell"].disabled = true;
					}
				}
			}, null, 664,400, 100,30);
		} else {
			this.buttons["buy"] = new Button("Buy", ()=>{
				if (this.selectedItem) {
					this.buyItem(this.selectedItemType, this.selectedItem, this.selectedItemCost);
					if (!this.canBuyItem(this.selectedItemType, this.selectedItem, this.selectedItemCost)) {
						this.buttons["buy"].disabled = true;
					}
				}
			}, null, 664,400, 100,30);
		}
		if (this.buttons["sell"]) {this.buttons["sell"].disabled = true;}
		if (this.buttons["buy"]) {this.buttons["buy"].disabled = true;}
	}

	filterInventory(category) {
		this.inventory.length = 0;
		this.tabType = category;
		if (category == "all") {
			for (let category in this.items) {
				for (let itemId in this.items[category]) {
					this.inventory.push(itemId);
				}
			}
		} else {
			for (let itemId in this.items[category]) {
				this.inventory.push(itemId);
			}
		}
	}

	// This is bad copy paste code. Please refactor if you ever touch this again.
	canBuyItem(itemType, itemId, cost=false) {
		// cost can be true, a number of nuggets, or an object with items and nuggets cost
		let item = ITEMS[itemType][itemId];
		if (item) { // Make sure item has been loaded
			let nuggets = SAVEDATA.nuggets;
			if (!cost || cost === true) {
				// Use default cost
				if (nuggets >= item.cost) {
					return true;
				}
			} else if (typeof cost == "number") {
				// Use shop's nugget cost
				if (nuggets >= cost) {
					return true;
				}
			} else {
				// Use shop's cost
				let itemsCost = cost.items;
				let nuggetsCost = cost.nuggets || 0;
				let canBuy = false;

				if (itemsCost) {
					// Check if you have items neccessary
					let canBuyItems = true;
					for (let itemId in itemsCost) {
						let itemsOwned = getItem(itemId);
						if (itemsOwned < itemsCost[itemId]) {
							canBuyItems = false;
							break;
						}
					}
					if (canBuyItems) {
						canBuy = true;
					}
				}

				if (nuggetsCost) {
					// Check if you have enough nuggets
					if (nuggets >= nuggetsCost) {
						canBuy = true;
					}
				}

				if (canBuy) {
					return true;
				}
			}
		}
		return false;
	}

	// TODO: maybe this should be in a different file so items can also be earned in other ways?
	buyItem(itemType, itemId, cost=false) {
		// cost can be true, a number of nuggets, or an object with items and nuggets cost
		let item = ITEMS[itemType][itemId];
		if (item) { // Make sure item has been loaded
			if (!cost || cost === true) {
				// Use default cost
				if (spendNuggets(item.cost)) {
					addItem(itemId, itemType);
				}
			} else if (typeof cost == "number") {
				// Use shop's nugget cost
				if (spendNuggets(cost)) {
					addItem(itemId, itemType);
				}
			} else {
				// Use shop's cost
				let itemsCost = cost.items;
				let nuggetsCost = cost.nuggets || 0;
				let canBuy = false;

				if (itemsCost) {
					// Check if you have items neccessary
					let canBuyItems = true;
					for (let itemId in itemsCost) {
						let itemsOwned = getItem(itemId);
						if (itemsOwned < itemsCost[itemId]) {
							canBuyItems = false;
							break;
						}
					}
					if (canBuyItems) {
						canBuy = true;
					}
				}

				if (nuggetsCost) {
					// Check if you have enough nuggets
					if (SAVEDATA.nuggets >= nuggetsCost) {
						canBuy = true;
					}
				}

				if (canBuy) {
					if (nuggetsCost) {
						spendNuggets(nuggetsCost);
					}
					if (itemsCost) {
						for (let itemId in itemsCost) {
							removeItem(itemId, null, itemsCost[itemId]);
						}
					}
					addItem(itemId, itemType);
				}
			}
		}
	}

	sellItem(itemType, itemId, cost=false, percentage) {
		// cost can be true, a number of nuggets, or an object with items and nuggets cost
		let item = ITEMS[itemType][itemId];
		if (item) { // Make sure item has been loaded
			let intentoryCount = getItem(itemId, itemType);
			if (intentoryCount > 0) {
				if (!cost || cost === true) {
					// Use default cost
					addNuggets(Math.floor(item.cost*percentage));
				} else if (typeof cost == "number") {
					// Use shop's nugget cost
					addNuggets(Math.floor(cost));
				} else {
					// Use shop's cost
					let itemsCost = cost.items;
					let nuggetsCost = cost.nuggets || 0;

					if (nuggetsCost) {
						addNuggets(nuggetsCost);
					}
					if (itemsCost) {
						for (let itemId in itemsCost) {
							addItem(itemId);
						}
					}
				}
				removeItem(itemId, itemType);
				return true;
			} else {
				return false;
			}
		}
	}

	keyPress(key) {

	}

	keyRelease(key) {
		
	}

	mouseClick(button, x, y) {
		super.mouseClick(button, x, y);
		if (!MENUS["chatMenu"].checkMouseInside()) {
			// Disable clicking anywhere else, except for chat hud
			return true;
		}
	}

	mouseRelease(button, x, y) {
		return super.mouseRelease(button, x, y);
	}

	mouseScroll(dy) {
		return super.mouseScroll(dy);
	}
	
	draw() {
		// Window
		let scale = 1;
		if (this.openTimer < 1) {
			scale = easing("easeOutBack", this.openTimer);
		}
		Draw.image(IMG.menu, null, this.x+this.w*0.5, this.y+this.h*0.5, 0, scale, scale, 0.5, 0.5);

		// Text
		Draw.setColor(112, 50, 16, scale);
		Draw.setFont(FONT.caption);
		Draw.text(this.name, 520, 142, "center");

		// Item information
		if (this.selectedItem) {
			let item = ITEMS[this.selectedItemType][this.selectedItem];
			if (item) { // Make sure item has been loaded
				// Name
				Draw.text(item.name, 563, 210, "left");
	
				let nuggetsCost = item.cost; // Default item cost
				let itemCost = false;
				if (this.sell) { // Get default sell price
					nuggetsCost = Math.floor(nuggetsCost*this.sellPercentage);
				}
				if (this.selectedItemCost) {
					if (typeof this.selectedItemCost == "object") {
						// Define items (and nuggets, if desired)
						nuggetsCost = false;
						itemCost = this.selectedItemCost.items;
						if (this.selectedItemCost.nuggets) {
							nuggetsCost = this.selectedItemCost.nuggets;
						}
					} else if (typeof this.selectedItemCost == "number") {
						// Define nuggets
						nuggetsCost = this.selectedItemCost;
					}
				}

				let costY = 388;
				if (nuggetsCost) { // Display nuggets cost
					Draw.text(`${nuggetsCost} Nuggets`, 764, costY, "right");
					costY -= 25;
				}
				// Display items cost
				if (itemCost) {
					for (let itemId in itemCost) {
						let item = getItemData(itemId);
						if (item) {
							Draw.text(`${itemCost[itemId]} ${item.name}(s)`, 764, costY, "right");
							costY -= 25;
						}
					}
				}

				// Display how many of this item you own
				if (SAVEDATA.items[this.selectedItemType][this.selectedItem]) {
					Draw.text(`Owned: ${SAVEDATA.items[this.selectedItemType][this.selectedItem]}`, 764, costY, "right");
				}
	
				// Description
				Draw.setColor(152, 80, 46, scale);
				Draw.setFont(FONT.description);
				if (this.selectedItemDescription) {
					for (let i = 0; i < this.selectedItemDescription.length; i++) {
						Draw.text(this.selectedItemDescription[i], 563, 242 + i * 20, "left");
					}
				}
			}
		} else {
			Draw.text("Select an item.", 563, 210, "left");
		}

		// Render all buttons
		this.drawButtons();
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt);

		this.updateButtons(dt);
	}
}();