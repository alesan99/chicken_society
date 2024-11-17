import {DRAW, SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "./main.js"
import {IMG, SPRITE, ANIM, FONT, ITEMS} from "./assets.js"
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "./savedata.js"
import {PLAYER, PLAYER_CONTROLLER, DEBUGPHYSICS, setDebugPhysics} from "./world.js"
import QuestSystem from "./quests.js"
import {requestItem, compareItems, clearItems, useItem, adoptPet} from "./items.js"
import AudioSystem from "./engine/audio.js"

function executeCommand(input) {
	let s = input.split(" ")
	let [command, arg, arg2, arg3] = [s[0], s[1], s[2], s[3]]

	console.log(command, arg)
	switch (command) {
		case "/name":
			PROFILE.name = arg
			PLAYER.updateProfile(PROFILE, "sendToServer")
			break
		case "/color":
			PROFILE.color = RGBtoHEX(Number(arg), Number(arg2), Number(arg3))
			PLAYER.updateProfile(PROFILE, "sendToServer")
			break
		case "/give":
			addItem(arg, null, Number(arg2) || 1)
			break
		case "/head":
			PROFILE.head = arg
			PLAYER.updateProfile(PROFILE, "sendToServer")
			break
		case "/face":
			PROFILE.face = arg
			PLAYER.updateProfile(PROFILE, "sendToServer")
			break
		case "/body":
			PROFILE.body = arg
			PLAYER.updateProfile(PROFILE, "sendToServer")
			break
		case "/scale": // Chicken size
			PROFILE.scale = arg
			PLAYER.updateProfile(PROFILE, "sendToServer")
			break
		case "/speed": // Chicken speed
			PLAYER.speed = arg
			break
		case "/area": // Warp to a different area
			WORLD.loadArea(arg, "chatWarp")
			break
		case "/minigame": // Start minigame
			setState(MINIGAME, arg)
			break
		case "/emote": // Play emote animation
			PLAYER.emote(arg)
			break
		case "/nuggets":
			// SAVEDATA.nuggets = Number(arg)
			addNuggets(Number(arg))
			// PLAYER.updateProfile(PROFILE, "sendToServer")
			break
		case "/quests": // Print out all active quests
			QuestSystem.debug()
			break
		case "/quest": // Force progress in quest
			if (!QuestSystem.getQuest(arg)) {
				QuestSystem.start(arg)
			} else {
				QuestSystem.progress(arg, Number(arg2) || 0, Number(arg3) || 1)
			}
			break
		case "/jump":
			PLAYER.jump(Number(arg) || 0)
			break
		case "/debug": // Debug physics
			setDebugPhysics(!DEBUGPHYSICS)
			break
		case "/notify": // Create notification
			Notify.new(arg)
			break
		case "/volume": // Set volume
			AudioSystem.setVolume(Number(arg))
			break
	}
}

export { executeCommand }