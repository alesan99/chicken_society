// Behavior for items (Clothing, consumables, furniture, etc.)

import {DRAW, SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "./main.js"
import {IMG, SPRITE, ANIM, FONT, ITEMS} from "./assets.js"
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem, makePetData} from "./savedata.js"
import {openMenu, closeMenu, getOpenMenu} from "./state.js"
import {PLAYER, PLAYER_CONTROLLER} from "./world.js"
import QuestSystem from "./quests.js"
import Transition from "./transition.js"
import Coop from "./coop.js"
import DialogueSystem from "./dialogue.js"

let activeItems = {} // List of items that are currently in player's inventory, being worn by other chickens, and being sold in area
// Mark down an item as active
function requestItem(itemId, itemType) {
	activeItems[itemId] = true
}

let oldActiveItems = {}
function compareItems() {
	oldActiveItems = {...activeItems}
}

function clearItems() {
	// Unload unused items
	for (let itemId in oldActiveItems) {
		if (!activeItems[itemId]) {
			// unloadItem(itemId)
		}
	}
}

// Use item
function useItem(itemId, itemType) {
	// Set clothing item
	// Returns true if item was removed

	// Equip Pet
	if (itemType == "pet") {
		// Equip
		let equipped = false
		if (PROFILE[itemType] == itemId) { // unequip
			PROFILE[itemType] = false;
		} else { // prompt to equip
			if (SAVEDATA.pet.id != itemId) {
				// Prompt to adopt a new pet
				openMenu("adoptMenu", itemId)
				return false;
			} else {
				PROFILE[itemType] = itemId;
			}
		}
		PLAYER.updateProfile(PROFILE, "sendToServer");
	// Equip clothing or item
	} else if (PROFILE.hasOwnProperty(itemType)) {
		// Equip
		let equipped = false
		if (PROFILE[itemType] == itemId) { // unequip
			PROFILE[itemType] = false;
		} else { // equip
			equipped = true
			PROFILE[itemType] = itemId;
		}
		PLAYER.updateProfile(PROFILE, "sendToServer");

		// Use consumable item
		let item = ITEMS[itemType][itemId] // Make sure item has been loaded
		if (item && equipped) {
			if (itemType == "item") {
				if (item.consumable) {
					// Consume item
					removeItem(itemId, itemType)
					if (item.statusEffect) {
						PLAYER.startStatusEffect(item.statusEffect, item.statusEffectDuration)
					}
					return true
				} else if (item.dialogue) {
					// Open book
					closeMenu()
					DialogueSystem.start(item.dialogue)
				}
			}
		}
	// Other items
	} else {
		let item = ITEMS[itemType][itemId]

		if (item) {
			// Change Coop theme
			if (item.coopTheme && PLAYER.area == "coop") {
				if (SAVEDATA.coop.theme == item.coopTheme) {
					// Toggle theme off
					Coop.setTheme(false)
				} else {
					// Set theme
					Coop.setTheme(item.coopTheme)
				}
				return false
			}
			// Place furniture
			if (itemType == "furniture" && PLAYER.area == "coop") {
				Coop.moveFurniture(itemId, closeMenu())
				return false
			}
		}
	}
	return false
}

// Adopt a new pet
// Replaces current pet data and assigns a name
function adoptPet(itemId, name="") {
	// Erase exisiting data
	SAVEDATA.pet = makePetData()
	// Set new pet data
	SAVEDATA.pet.name = name
	SAVEDATA.pet.id = itemId

	PROFILE.pet = itemId
	PLAYER.updateProfile(PROFILE, "sendToServer");

	if (PLAYER.petObj) {
		PLAYER.petObj.updateProfile(SAVEDATA.pet, "sendToServer")
	}
}

export {requestItem, compareItems, clearItems, useItem, adoptPet}