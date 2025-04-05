// Pet object; Follows player.

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
import {PhysicsObject,Character,Player,NPC,Trigger,Wall,Warp,Furniture,Particle} from "./objects.js"
import {openMenu, closeMenu, getOpenMenu} from "../state.js"

export default class Pet extends PhysicsObject {
	//Initialize: pet id (item id), x pos, y pos, 'owner' object to follow
	constructor (spatialHash, id, x, y, owner, profile) {
		// Collision
		super(spatialHash,x,y)
		this.x = x
		this.y = y
		this.w = 40
		this.h = 30

		this.shape = new Shape(
			-this.w/2, -this.h,
			this.w/2, -this.h,
			this.w/2, 0,
			-this.w/2, 0
		)

		this.sx = 0
		this.sy = 0

		// Pet data
		this.id = id
		if (profile) {
			this.updateProfile(profile)
		}
		this.owner = owner
		this.maxSpeed = 180
		this.speed = this.maxSpeed
		this.area = owner.area

		// Status
		this.disease = false

		this.dead = false

		// Pet race
		this.hidden = false

		// Movement
		this.walking = false

		// Clickable
		this.mouseOver = false
		this.activated = false

		// Graphics
		// TODO: Come up with a better solution!
		if (ITEMS.pet[id]) {
			this.image = ITEMS.pet[id].image
			this.sprite = ITEMS.pet[id].sprite
		} else {
			this.image = IMG.placeholder
			this.sprite = SPRITE.placeholder
		}
		this.anim = new Animation(this.sprite, 0)
		this.anim.setFrame(0,0)

		this.flip = 1
		this.scale = 1

		this.active = false
		this.static = false
		this.setPosition(null,null)
	}

	update(dt) {
		// Fix placeholder image
		if (this.image == IMG.placeholder) {
			if (ITEMS.pet[this.id]) {
				this.image = ITEMS.pet[this.id].image
				this.sprite = ITEMS.pet[this.id].sprite
				this.anim.sprite = this.sprite
			}
		}

		// Follow behind owner
		if (this.owner != null && !this.dead) {
			// Target
			let tx = this.owner.x
			let ty = this.owner.y

			let dist = (tx-this.x)*(tx-this.x) + (ty-this.y)*(ty-this.y)
			if (dist > 4000) {
				let angle = Math.atan2(ty-this.y, tx-this.x)
				this.sx = Math.cos(angle)*this.speed
				this.sy = Math.sin(angle)*this.speed

				// Animation
				if (this.sx > 0) {
					this.flip = 1
				} else {
					this.flip = -1
				}

				if (!this.walking) {
					this.anim.playAnimation([1,2], 0.15)
					this.walking = true
				}
			} else {
				this.sx = 0
				this.sy = 0

				// Animation
				if (this.walking) {
					this.anim.stopAnimation(0, null)
					this.walking = false
				}
			}

			this.area = this.owner.area
		}

		// Manage -your- Pet
		if (this.owner == PLAYER && !this.hidden) {
			if (!getOpenMenu()) {
				this.activated = false // Closing menu will let you click on pet again
			}
			// Click
			if ((this.activated == false) && this.checkMouseOver()) {
				this.mouseOver = true
				CURSOR.on = true
			} else {
				this.mouseOver = false
			}

			// Update mood and life cycles
			if (this.dead) {
				
			} else {
				this.updateLife(dt)
			}
		}

		// Update Animation
		this.anim.update(dt)
	}

	// Update pet life
	updateLife(dt) {
		// Hunger decreases over time
		this.hunger = Math.max(0, this.hunger - 0.0004*dt)
		let starvingThreshold = 0.2
		if (this.hunger <= starvingThreshold) {
			// If starving, health decreases
			let speed = 0.005*((starvingThreshold-this.hunger)/starvingThreshold)
			this.health = Math.max(0, this.health - speed*dt)
		}

		// Hunger affects happiness
		if (this.hunger < 0.75) {
			this.happiness = Math.max(0, this.happiness - 0.003*dt)
		}
		if (this.health < 0.5) {
			this.happiness = Math.max(0, this.happiness - 0.002*dt)
		}
		if (this.health > 0.85) {
			this.happiness = Math.min(1, this.happiness + 0.002*dt)
		}

		this.speed = this.maxSpeed - 50*(1.0-this.happiness)

		// Update graphics
		if (this.happiness >= 0.5) {
			// Happy frames
			this.anim.setFrame(null, 0)
		} else {
			// Sad frames
			this.anim.setFrame(null, 1)
		}

		if (this.health <= 0) {
			// Dead
			this.anim.stopAnimation(3,1)
			this.dead = true
			this.sx = 0
			this.sy = 0
			this.walking = false
		}
	}

	draw(drawX=this.x, drawY=this.y, dir=this.dir) {
		if (this.hidden) {
			return false
		}

		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.shadow, null, drawX, drawY, 0, this.scale, this.scale, 0.5, 1)

		// Pet graphic
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(this.image, this.anim.getFrame(), drawX, drawY, 0, this.flip*this.scale, this.scale, 0.5, 1)

		// Name
		DRAW.setFont(FONT.nametag, 3)
		DRAW.text(this.name, drawX, Math.floor(drawY)+20, "center")
	}

	checkMouseOver() {
		let [mouseX, mouseY] = getMousePos()
		return this.shape.checkInside(mouseX-this.x, mouseY-this.y)
	}

	click(button, x, y) {
		if (button == 0 && this.mouseOver) {
			// Open pet menu
			openMenu("petMenu")
			this.activated = true
			return true
		}
		return false
	}

	collide (name, obj, nx, ny) {
		return false
	}

	startCollide (name, obj, nx, ny) {
	}

	// Pet behavior
	getMood() {
		let moods = [
			"heavenly",
			"jolly",
			"happy",
			"coy",
			"groovy",
			"just alright",
			"bored",
			"so-so",
			"meh",
			"emo",
			"sad",
			"depressed",
			"dorceless",
			"miserable"
		]
		let hungry_moods = [
			"hungry",
			"hangry",
			"absolutely famished",
		]
		let word = "mysterious"

		if (this.dead) {
			word = "dead"
		} else {
			// Feeling whatever happiness is
			word = moods[((1-this.happiness)*(moods.length-1))|0]
		}
		return word
	}

	eat(item) {
		// Eat item, reduce hunger
		if (item.food != null) {
			// Pet is already full!
			if (this.hunger >= 0.99) {
				this.health -= 0.03
			}

			// Satisfy hunger
			this.hunger = Math.min(1.0, this.hunger + item.food)
		}
	}

	// Update customization data
	updateProfile(profile, sendToServer) {
		this.name = profile.name || ""
		this.happiness = profile.happiness || 0.8
		this.health = profile.health || 1
		this.hunger = profile.hunger || 1

		if (sendToServer) {
			NETPLAY.sendPetProfile(profile)
		}
	}
}