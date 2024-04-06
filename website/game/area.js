// Area
// logic that controls the background and elements of an area

// Load area data from .json
function loadAreaFile(data, world, fromWarp, endFunc) {
	let area = world.area
	let fromArea = world.oldArea

	// Get general information
	world.areaName = data.name || "???"
	world.areaMapLocation = data.mapLocation || false

	// Load music
	if (data.music) {
		if (MUSIC[data.music]) {
			AudioSystem.playMusic(MUSIC[data.music])
		} else {
			console.log("Music not found: " + data.music)
		}
	} else {
		AudioSystem.stopMusic()
	}
	// Load area walls
	// Go through each polygon & make wall
	if (data.walls) {
		let i = 0
		for (const poly of data.walls) {
			// Create wall object
			i++
			OBJECTS["Wall"][i] = new Wall(PHYSICSWORLD, ...poly)
		}
	}
	// Load warps
	if (data.warps) {
		for (const [name, warp] of Object.entries(data.warps)) {
			OBJECTS["Warp"][name] = new Warp(PHYSICSWORLD, warp.to, warp.from, name, warp.fromWarp, warp.facing, warp.x, warp.y, warp.w, warp.h)
		}
		
		// Get spawn location
		for (const [i, obj] of Object.entries(OBJECTS["Warp"])) {
			if ((obj.fromWarp && obj.fromWarp == fromWarp) || (obj.fromArea && obj.fromArea == fromArea)) {
				PLAYER_CONTROLLER.reset(obj.frontx, obj.fronty+PLAYER.shape.h/2, obj.facing)
			}
		}
	}
	// Load NPCS
	if (data.NPCs) {
		for (const [name, npc] of Object.entries(data.NPCs)) {
			let isActive = true // If it belongs to a quest, make sure its active
			if (npc.condition) {
				isActive = checkCondition(npc.condition)
			}
			if (isActive) {
				OBJECTS["Character"][name] = new Character(PHYSICSWORLD, npc.x, npc.y, npc.profile, area)
				NPCS[name] = new NPC(OBJECTS["Character"][name], npc.speechBubble, npc.facing, npc.roamRadius, npc.interactRange, {shop: npc.shop, dialogue: npc.dialogue}, npc.image)
			}
		}
	}
	
	// Load triggers
	if (data.triggers) {
		for (const [name, trig] of Object.entries(data.triggers)) {
			let isActive = true // If it belongs to a quest, make sure its active
			if (trig.condition) {
				isActive = checkCondition(trig.condition)
			}

			if (isActive) {
				let func = false
				// trig.action is a string describing what the trigger should do, create a function based on that
				let action = trig.action
				if (trig.cost && trig.icon) { // apply cost to icon text
					trig.icon.text = trig.cost
				}
				OBJECTS["Trigger"][name] = new Trigger(PHYSICSWORLD, trig.x, trig.y, trig.shape, null, trig.clickable, trig.icon)
				
				// TODO: Put this code somewhere else (area.js?)
				if (action == "minigame") {
					// Start minigame
					func = function() {
						// Does this trigger cost something?
						if (trig.cost) {
							removeNuggets(trig.cost)
						}

						PLAYER.static = true // Don't let player move
						Transition.start("wipeLeft", "out", 0.8, null, () => {
							OBJECTS["Trigger"][name].reset()
							setState(MINIGAME, trig.minigameName) // Start minigame after transition
							Transition.start("wipeRight", "in", 0.8, null, null)
						})
					}
				} else if (action == "quest") {
					// Progress quest
					func = function() {
						if (trig.questSlotAdd) {
							QuestSystem.progress(trig.quest, trig.questSlot, trig.questSlotAdd)
						} else if (trig.questSlotSet) {
							QuestSystem.setProgress(trig.quest, trig.questSlot, trig.questSlotSet)
						}
						
						// Disable trigger if conditions aren't met
						// TODO: Move this to the progress function in QuestSystem so it gets updated when progressed in other ways
						let isActive = true // If it belongs to a qsuest, make sure its active
						if (trig.condition) {
							isActive = checkCondition(trig.condition)
						}
						OBJECTS["Trigger"][name].active = isActive
					}
				} else if (action == "dialogue") {
					// Start dialogue
					func = function() {
						DialogueSystem.start(trig.dialogue)
						OBJECTS["Trigger"][name].reset()
					}
				}

				OBJECTS["Trigger"][name].action = func
				
				// inject sprite into sprites list
				if (trig.sprite) {
					let sprite = trig.sprite
					// inherit trigger properties
					if (!sprite.x) {
						sprite.x = trig.x
						sprite.y = trig.y
					}
					sprite.condition = trig.condition
					if (!data.sprites) { data.sprites = {} }
					data.sprites[name] = sprite
				}
			}
		}
	}
	
	// Load additional Sprites & Animations
	if (data.sprites) {
		for (const [name, s] of Object.entries(data.sprites)) {
			let img = s.image
			if (!(s.quest && !QuestSystem.getQuest(s.quest))) { // If it belongs to a quest, make sure its active
				if (!BACKGROUNDIMG[area][img]) {
					BACKGROUNDIMG[area][img] = new RenderImage(`assets/areas/${img}`)
				}
				let sprite = new Sprite(BACKGROUNDIMG[area][img], s.framesx, s.framesy, s.w, s.h, s.ox, s.oy, s.sepx, s.sepy)
				BACKGROUNDSPRITE[area][name] = new DrawableSprite(sprite, null, s.x, s.y, s.worldy)
				// Conditional visiblity
				if (s.condition) {
					BACKGROUNDSPRITE[area][name].condition = s.condition
				}
				// If defined, play animation
				if (s.anim) {
					BACKGROUNDANIM[area][name] = new Animation(sprite, 0, 0)
					BACKGROUNDANIM[area][name].playAnimation(s.anim.frames, s.anim.delay, null)
					BACKGROUNDSPRITE[area][name].anim = BACKGROUNDANIM[area][name]
				}
			}
		}
	}

	// Call function passed to loadArea after loading is successful
	if (endFunc) {
		endFunc()
	}
}

// A "condition" is a property for sprites, triggers, and dialogue options
// It determines if the element should activate if the conditions are met
// Example: "egg" should only appear in an area if the egg Quest is active
function checkCondition(c) {
	if (c.quest) {
		let questName = c.quest
		if (c.questComplete != null) {
			// "questComplete" just checks if the quest has ever been completed
			// Setting it to false will check if it has never been completed
			questCompleted = SAVEDATA.quests.completed[questName]
			if (c.questComplete === true && questCompleted) {
				return true
			} else if (c.questComplete === false && !questCompleted) {
				return true
			}
			return false
		} else if (QuestSystem.getQuest(questName)) {
			// Quest is active; make sure progress conditions are met
			let progressMet = true

			if (c.questSlot != null) {
				let slot = c.questSlot
				let value = c.questSlotValue
				// Check if slot is a list of values
				if (!Array.isArray(slot)) {
					// turn it into a list for code simplicity
					slot = [slot]
					value = [value]
				}
				for (let i=0; i<slot.length; i++) {
					if (QuestSystem.getProgress(questName, slot[i]) != value[i]) {
						progressMet = false
					}
				}
			}

			return progressMet
		} else {
			// condition not met
			return false
		}
	}
	return true // No condition was defined, so just activate it anyway
}