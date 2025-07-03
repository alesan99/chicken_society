import { addItem, getItem, getItemData } from "../savedata.js";
import Notify from "../gui/notification.js";
import { loadSaveData, applySaveData } from "../savedata.js";
import { WORLD, NETPLAY } from "../main.js";
import LoadingScreen from "../loading.js";

// Activate events based on special URLs
export function handleUrl() {
	const params = new URLSearchParams(window.location.search);

	// Get item from url /?t=<item>
	const encodedItems = params.get("t");
	if (encodedItems) {
		// The item will be encoded in base64
		const itemsString = atob(encodedItems);
		console.log(`Special URL, getting item(s): ${itemsString}`);
		const items = itemsString.split(",");
		let addedItems = 0; // Count how many items were successfully added
		for (let item of items) {
			let itemData = getItemData(item);
			if (itemData && !getItem(item)) {
				// For now you can only recieve items you don't already own
				addedItems++;
				addItem(item);
				if (items.length == 1) {
					Notify.new(`Thanks for joining! \n You got a free ${itemData.name}!`, 15);
				}
			}
		}
		if (addedItems > 1) {
			Notify.new("Thanks for joining! \n You got some free goodies!", 15);
		}
	}

	// Dev mode
	const devMode = params.get("dev") && NETPLAY.id == "OFFLINE";
	if (devMode) {
		console.log("Dev mode");
	}

	// Warp to area
	const area = params.get("area");
	if (devMode) {
		LoadingScreen.start(() => {});
		WORLD.loadArea(area, "chatWarp");
	}

	// Remove params the url
	const newUrl = window.location.origin + window.location.pathname;
	window.history.replaceState({}, document.title, newUrl);
}