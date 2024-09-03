//Wall, collides with other objects to stop them

import {DRAW, SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "../main.js"
import {IMG, SPRITE, ANIM, FONT, SFX, ITEMS} from "../assets.js"
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js"
import Shape from "../shape.js"
import { canvasWidth, canvasHeight } from "../engine/render.js"
import { OBJECTS, PLAYER, PLAYER_CONTROLLER, PHYSICSWORLD } from "../world.js"
import { Animation } from "../engine/sprite.js"
import QuestSystem from "../quests.js"
import DialogueSystem from "../dialogue.js"
import AudioSystem from "../engine/audio.js"
import Transition from "../transition.js"
import {requestItem, compareItems, clearItems, useItem, adoptPet} from "../items.js"
import { getMousePos } from "../engine/input.js"
import { vec2Unit } from "../lib/vec2.js"
import {PhysicsObject,Character,Player,NPC,Pet,Trigger,Warp,Furniture,Particle} from "./objects.js"

export default class Wall extends PhysicsObject {
	//Initialize: list of points
	constructor (spatialHash,...points) {
		// Collision
		super(spatialHash,0,0)
		this.x = 0
		this.y = 0

		this.shape = new Shape(...points)

		this.active = true
		this.static = true
		this.setPosition(null,null)
	}
}