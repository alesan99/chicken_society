//NPC object, controls the position of another object along with interactable dialouge

import {DRAW, SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "../main.js"
import {IMG, SPRITE, ANIM, FONT, SFX, ITEMS} from "../assets.js"
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js"
import Shape from "../shape.js"
import { canvasWidth, canvasHeight } from "../engine/render.js"
import { OBJECTS, PLAYER, PLAYER_CONTROLLER, PHYSICSWORLD } from "../world.js"
import { Animation } from "../engine/sprite.js"
import QuestSystem from "../quests.js"
import AudioSystem from "../engine/audio.js"
import DialogueSystem from "../dialogue.js"
import Transition from "../transition.js"
import {requestItem, compareItems, clearItems, useItem, adoptPet} from "../items.js"
import { getMousePos } from "../engine/input.js"
import { vec2Unit } from "../lib/vec2.js"
import {PhysicsObject,Character,Player,Pet,Trigger,Wall,Warp,Furniture,Particle} from "./objects.js"
import {Button, TextField, ColorSlider, ScrollBar} from "../gui/gui.js"
import {openMenu, closeMenu, getOpenMenu} from "../state.js"

export default class NPC {
	//Initialize: object, roam? radius in pixels of area to walk around, interactable interactRange, clickable region, shop menu?
	constructor (obj, speechBubble, facing="down", roamRadius=false, interactRange=50, replies, imageName="chicken") {
		this.obj = obj
		obj.controller = this
		obj.npc = true

		// Custom image
		if (imageName) {
			obj.image = IMG[imageName]
		}

		// Adjust object
		this.obj.dir = facing
		if (facing == "left") {
			this.obj.flip = -1
		}

		// Walk around
		this.originX = this.obj.x
		this.originY = this.obj.y
		this.roamRadius = roamRadius
		this.waitTime = 2
		this.walkTime = 1
		this.walkTimer = this.walkTime
		this.dir = [1, 0] // Walking direction vector

		// Behavior
		this.replies = replies || {}
		this.shop = this.replies.shop // Open up shopping menu to prompt player to buy stuff
		this.dialogue = this.replies.dialogue // Start dialogue, for quest purposes

		// Replies
		this.awaitingReply = false
		this.replyButtons = []

		// speechBubble Trigger
		this.speechBubble = speechBubble || [""]
		let func = () => {
			// Speak when clicked or near
			this.speak()

			// Dialouge reply options
			let replyOptions = []
			// Open shop if specified
			if (this.shop) {
				let shopEnabled = true
				if (this.shop.condition) { // Check if shop should appear (quests)
					shopEnabled = checkCondition(this.shop.condition)
				}
				if (shopEnabled) {
					if (this.shop.sell) {// Can you sell your items?
						replyOptions.push(["Sell", () => {openMenu("shop", this.shop, true); this.closeReply()}])
					} else {
						replyOptions.push(["Buy", () => {openMenu("shop", this.shop, false); this.closeReply()}])
					}
				}
			}
			// Talk
			if (this.dialogue) {
				replyOptions.push(["Talk", () => {DialogueSystem.start(this.dialogue, this.obj.name, this.obj); this.closeReply()}])
			}
			// Start Quest directly (For testing)
			if (this.replies.quest) {
				replyOptions.push(["Quest", () => {QuestSystem.start(this.replies.quest); this.closeReply()}])
			}
			this.requestReply(replyOptions)
		}
		let interactRangeShape = interactRange // Where does player have to stand to interact?
		if (!Array.isArray(interactRange)) { // Use rectangular range instead of user-defined shape
			interactRangeShape = [-interactRange,-interactRange, interactRange,-interactRange, interactRange,interactRange, -interactRange,interactRange]
		}
		let clickShape = [-40,-100, 40,-100, 40,20, -40,20]
		this.trigger = WORLD.spawnObject("Trigger", new Trigger(PHYSICSWORLD, this.obj.x, this.obj.y-this.obj.shape.h/2, interactRangeShape, func, clickShape, {frame:0,x:0,y:-120}))
	}

	// Update
	update(dt) {
		let char = this.obj

		// walk around
		if (this.roamRadius) {
			// Only walk if they aren't talking
			if (!char.bubbleTime) {
				let distanceFromOrigin = Math.sqrt((char.x - this.originX)**2 + (char.y - this.originY)**2)

				this.walkTimer += dt
				if (this.walkTimer > this.walkTime+this.waitTime) {
					// Start over
					// Pick random waiting time and walking time
					this.waitTime = Math.random()*5 + 3
					this.walkTime = Math.random()*0.4 + 0.2

					this.walkTimer = 0
				} else if (this.walkTimer > this.walkTime) {
					// Wait
					let angle = (Math.PI/2)*Math.floor(Math.random()*4)
					this.dir[0] = Math.cos(angle)
					this.dir[1] = Math.sin(angle)
					
					let nextDistanceFromOrigin = Math.sqrt((char.x+this.dir[0] - this.originX)**2 + (char.y+this.dir[1] - this.originY)**2)
					// Go turn around if currently outside of roam radius
					if (distanceFromOrigin > this.roamRadius && nextDistanceFromOrigin > distanceFromOrigin) {
						this.dir[0] = -this.dir[0]
						this.dir[1] = -this.dir[1]
					}

					char.move(0, 0)
				} else {
					// Walk
					let [dx, dy] = [this.dir[0], this.dir[1]]
					char.move(dx, dy)
				}
			} else {
				char.move(0, 0)
			}
		}

		// Stick trigger to NPC
		this.trigger.setPosition(char.x, char.y-char.shape.h/2)
		// Reset trigger if activated
		if (char.bubbleText == false && this.trigger.activated) {
			this.trigger.reset()
		}
		if (!char.bubbleText && this.awaitingReply) {
			this.closeReply()
		}

		// Responses
		if (this.replyButtons.length > 0) {
			for (const replyButton of this.replyButtons) {
				replyButton.update(dt)
			}
		}
	}

	draw() {
		// Responses
		if (this.replyButtons.length > 0) {
			for (const replyButton of this.replyButtons) {
				replyButton.draw()
			}
		}
	}

	click(button, x, y) {
		if (this.replyButtons.length > 0) {
			for (const replyButton of this.replyButtons) {
				if (replyButton.click()) {
					return true
				}
			}
		}
	}

	clickRelease(button, x, y) {
		if (this.replyButtons.length > 0) {
			for (const replyButton of this.replyButtons) {
				replyButton.clickRelease()
			}
		}
	}

	speak() {
		let i = Math.floor(Math.random() * this.speechBubble.length)
		this.obj.speechBubble(this.speechBubble[i])

		QuestSystem.event("talk", this.obj.name) // Progress quests
	}

	requestReply(options){
		this.awaitingReply = true
		let replies = options.length
		for (let i = 0; i < replies; i++) {
			let label = options[i][0]
			let func = options[i][1]
			let button = new Button(label, func, {image: IMG.replyBubble, frames:[SPRITE.replyBubble.getFrame(0),SPRITE.replyBubble.getFrame(0),SPRITE.replyBubble.getFrame(1)]}, this.obj.x+66*i-(replies*66/2), this.obj.y-275, 64,32)
			this.replyButtons.push(button)
		}
	}

	closeReply(){
		this.awaitingReply = false
		this.replyButtons = []
		this.obj.bubbleText = false
	}
}