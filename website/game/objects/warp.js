// Warp object; Moves player to a different location when touched.

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
import {PhysicsObject,Character,Player,NPC,Pet,Trigger,Wall,Furniture,Particle} from "./objects.js"

export default class Warp extends PhysicsObject {
	//Initialize: x pos, y pos, width, height
	constructor (spatialHash,area, fromArea, name, fromWarp, facing, x, y, w, h, sound=false) {
		// Collision
		super(spatialHash,x,y)
		this.x = x
		this.y = y
		this.w = w
		this.h = h

		this.area = area
		this.fromArea = fromArea
		this.name = name
		this.fromWarp = fromWarp // Name of Warp that leads to this one
		this.facing = facing || "down" // Where is the warp/door facing?
		this.frontx = this.x // Where to place player when spawning from this warp
		this.fronty = this.y
		let offset = 40
		if (facing == "down") {
			this.fronty += (this.h+offset)
		} else if (facing == "up") {
			this.fronty -= (this.h+offset)
		} else if (facing == "left") {
			this.frontx -= (this.w+offset)
		} else if (facing == "right") {
			this.frontx += (this.w+offset)
		}

		this.shape = new Shape(
			-this.w/2, -this.h/2,
			this.w/2, -this.h/2,
			this.w/2, this.h/2,
			-this.w/2, this.h/2
		)

		// Sound
		this.sound = sound

		this.active = true
		this.static = true
		this.setPosition(null,null)
	}

	collide (name, obj, nx, ny) {
		return false
	}

	startCollide (name, obj, nx, ny) {
		if (name == "Character" && obj == PLAYER) {
			this.doWarp(PLAYER)
		}
	}

	// Warp Player to area given to Warp
	doWarp (character) {
		if (this.sound) {
			AudioSystem.playSound(SFX[this.sound])
		}
		WORLD.warpToArea(this.area, this.name, character)
	}
}