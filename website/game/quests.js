// Quest System
// Can be used to start and progress a quest.
// Handles quest completion and rewards.

const QuestSystem = (function() {
	let questData = {}
	let activeQuests = {}

	const functions = {
		// Load all previously started quests. To be called when saveData is loaded.
		initialize() {
			//TODO: start all quests previously started (stored in SAVEDATA)
			activeQuests = {}; // Clear any quests from old saveData

			this.start("tutorial") // First story quest
			this.start("world") // Used for storing world state

			for (let questName in SAVEDATA.quests.active) {
				this.start(questName, "initial")
			}
		},

		// Start quest if it isn't active and hasn't been completed yet.
		start(questName, initial) {
			let quest = this.getQuest(questName) // Check if quest is already active
			if (!quest && !SAVEDATA.quests.completed[questName]) {
				// Load quest properties from json file in the assets folder
				// BEWARE, the quest won't start until this file is finished loading
				// TODO: Load all the quests beforehand? Their titles and descriptions will need to be seen in the quests menu.
				this.loadQuestData(questName, (data) => {
					// Create copy of quest data to track progress
					// activeQuests[questName] = {
					// 	name: data.name,
					// 	description: data.description,

					// 	progressDescription: data.progressDescription,

					// 	progress: SAVEDATA.quests.active[questName] || data.progressStart,
					// 	progressFinish: data.progressFinish,

					// 	progressEvents: data.progressEvents,

					// 	reward: data.reward,

					// 	complete: false,
					// }
					activeQuests[questName] = data
					let quest = activeQuests[questName]

					quest.progress = SAVEDATA.quests.active[questName] || data.progressStart
					quest.complete = false

					if (!SAVEDATA.quests.active[questName]) {
						// Starting quest for the first time
						if (!quest.hidden) {
							Notify.new(quest.description, 8)
							Notify.new("You started the quest: " + quest.name, 8)
							MENUS["chatMenu"].notification("quest", true)
						}
						// Save default progress
						// TODO: There should be a SaveData function for this, saving progress will be more complicated when the database is implemented
						SAVEDATA.quests.active[questName] = quest.progress
					}

				
					this.initialEvents(questName)
					conditionsUpdate()
				})
			}
		},

		// Load quest data from file
		// This does NOT start the quest
		loadQuestData(questName, func) {
			loadJSON5(`assets/quests/${questName}.json5`, (data) => {
				questData[questName] = data
				let quest = questData[questName]
				if (SAVEDATA.quests.completed[questName]) {
					quest.progress = SAVEDATA.quests.completed[questName]
					quest.complete = true
				}
				quest.complete = false
				func(data)
			})
		},
		// Get quest data even if its not active
		getQuestData(questName) {
			let activeQuestData = this.getQuest(questName) // Attempt to get active quest data
			if (activeQuestData) {
				return activeQuestData // Return active quest if exists
			} else if (questData[questName]) {
				return questData[questName] // Otherwise, return raw quest data
			}
			return false // Or it doesn't exist
		},

		// Call anytime something happens that could possibly progress a quest.
		event(type, ...args) {
			for (let questName in activeQuests) {
				// Check all quests to see if any are affected by this event
				let quest = activeQuests[questName]
				if (quest.progressEvents) {
					for (let slot=0; slot < quest.progressEvents.length; slot++) {
						let event = quest.progressEvents[slot]
						if (event != false && event.type == type) {
							// Quest is accepting event!
							doProgress = false
							if (type == "minigame") {
								// args: minigame
								let minigame = args[0]
								if (event.minigame == null) { // any minigame will do
									doProgress = true
								} else if (event.minigame == minigame) { // must be specified minigame
									doProgress = true
								}
							} else if (type == "minigameHighscore") {
								// args: minigame, score
								let minigame = args[0]
								let score = args[1]
								if (event.minigame == minigame && score >= event.score) {
									doProgress = true
								}
							} else if (type == "talk") {
								// args: npc name
								let npcName = args[0]
								if (event.name == npcName) {
									doProgress = true
								}
							} else if (type == "clothes") {
								// args: head, face, body, item
								let head = args[0]
								let face = args[1]
								let body = args[2]
								let item = args[3]
								if (event.costGreater != null) {
									// Is outfit greater/less than defined cost?
									let cost = 0
									if (head) {
										cost += ITEMS.head[head].cost
									}
									if (face) {
										cost += ITEMS.face[face].cost
									}
									if (body) {
										cost += ITEMS.body[body].cost
									}
									if (item) {
										cost += ITEMS.item[item].cost
									}
									if (cost >= event.costGreater) {
										doProgress = true
									}
								}
							} else if (type == "area") {
								// args: area name
								let area = args[0]
								if (event.area == area) {
									doProgress = true
								}
							} else if (type == "nuggets") {
								// args: nuggets
								let nuggets = args[0]
								if (nuggets >= event.nuggetsGreater) {
									doProgress = true
								}
							} else {
								// Not a predefined event
								doProgress = true
							}
	
							// Progress quest
							if (doProgress) {
								if (event.questSlotAdd) {
									this.progress(questName, slot, event.questSlotAdd)
								} else if (event.questSlotSet) {
									this.setProgress(questName, slot, event.questSlotSet)
								}
							} else {
								// Quest event may have a property to undo progress if event isn't accepted
								if (event.questSlotDefault) {
									this.setProgress(questName, slot, event.questSlotDefault)
								}
							}
						}
					}
				}
			}
		},

		// Automatically trigger events that should've been triggered before quest was started.
		initialEvents(questName) {
			// Anything that type of quest event that can be completed before quest starts NEEDS to be here.
			let quest = this.getQuest(questName)
			if (quest.progressEvents) {
				for (let slot=0; slot < quest.progressEvents.length; slot++) {
					let event = quest.progressEvents[slot]
					if (event != false) {
						let type = event.type
						// Minigame highscore might've been reached before quest started
						if (type == "minigameHighscore") {
							if (SAVEDATA.highscores[event.minigame]) {
								this.event("minigameHighscore", SAVEDATA.highscores[event.minigame])
							}
						// Clothes requirements might've been met before quest started
						} else if (type == "clothes") {
							this.event("clothes", PLAYER.head, PLAYER.face, PLAYER.body, PLAYER.item)
						} else if (type == "nuggets") {
							this.event("nuggets", SAVEDATA.nuggets)
						}
					}
				}
			}
		},

		// Set quest progress slot to a value.
		setProgress(questName, progressSlot, value) {
			let quest = this.getQuest(questName)
			if (quest) {
				quest.progress[progressSlot] = value

				// Save progress
				SAVEDATA.quests.active[questName] = quest.progress
				
				conditionsUpdate()

				// Check completion
				for (let i=0; i<quest.progress.length; i++) {
					if (quest.progress[i] < quest.progressFinish[i]) {
						return // Requirement not met
					}
				}

				// Quest is complete
				this.complete(questName)
			}
		},

		// Increment quest progress slot by value.
		progress(questName, progressSlot, value=1) {
			let quest = this.getQuest(questName)
			if (quest) {
				let currentValue = quest.progress[progressSlot]
				this.setProgress(questName, progressSlot, currentValue + value)
			}
		},

		// Mark quest as complete, save progress, and remove from activeQuest update list.
		complete(questName) {
			// FYI: a quest is complete once all progress slots are >= progressFinish slots
			let quest = this.getQuest(questName)
			if (quest) {
				// Notify
				Notify.new("You completed the quest: " + quest.name)
				
				// Give reward(s)
				for (let rewardType in quest.reward) {
					if (rewardType == "nuggets") {
						// Nuggets
						addNuggets(quest.reward[rewardType])
					} else if (rewardType == "item") {
						// Item
						addItem(null, quest.reward[rewardType])
					} else if (rewardType == "quest") {
						// Start new quest
						let questName = quest.reward[rewardType]
						this.start(questName)
					}
				}

				// Mark as complete
				quest.complete = true
				SAVEDATA.quests.completed[questName] = quest.progress
				delete activeQuests[questName]
				delete SAVEDATA.quests.active[questName]

				conditionsUpdate()
			}
		},

		// Return active quest data/progress, if it is active.
		getQuest(questName) {
			if (!activeQuests[questName]) {
				return false
			}
			return activeQuests[questName]
		},

		// Return quest progress slot
		getProgress(questName, slot) {
			let quest = this.getQuest(questName)
			if (quest) {
				// If quest is active, return current progress
				return quest.progress[slot]
			} else if (SAVEDATA.quests.completed[questName]) {
				// If quest is complete, return saved progress
				return SAVEDATA.quests.completed[questName][slot]
			}
		},

		getAllActiveQuests() {
			return activeQuests
		},

		getAllCompletedQuests() {
			//SAVEDATA.quests.completed (Not properly formatted)
			let completedQuests = {}
			for (let questName in SAVEDATA.quests.completed) {
				let quest = this.getQuestData(questName)
				if (quest) {
					// Return quest if it has been loaded
					completedQuests[questName] = quest
				} else {
					// Load quest data if it hasn't been loaded
					completedQuests[questName] = {
						name: "Loading...",
						description: "Loading...",
						progress: [],
						progressFinish: [],
						complete: true
					}
					this.loadQuestData(questName, (data) => {
						completedQuests[questName] = data
					})
				}
			}
			return completedQuests
		},

		// Print all active quest for testing purposes myes
		debug() {
			for (let questName in activeQuests) {
				let quest = activeQuests[questName]
				let progressString = ""
				for (let i=0; i<quest.progress.length; i++) {
					progressString += `${quest.progress[i]}/${quest.progressFinish[i]} `
				}
				console.log(`${questName}: ${progressString}`)
				Notify.new(`${questName}: ${progressString}`)
			}
		}
	};
	
return functions; })()