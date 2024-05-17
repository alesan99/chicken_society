// Behavior for items (Clothing, consumables, furniture, etc.)

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

	// Equip clothing or item
	if (PROFILE.hasOwnProperty(itemType)) {
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