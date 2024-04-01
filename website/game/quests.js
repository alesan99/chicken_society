// Quest System
// Can be used to start and progress a quest.
// Handles quest completion and rewards.

const QuestSystem = (function() {
	let activeQuests = {}

	const functions = {
		// Load all previously started quests. To be called when saveData is loaded.
		initialize() {
			//TODO: start all quests previously started (stored in SAVEDATA)
			activeQuests = {}; // Clear any quests from old saveData

			for (let questName in SAVEDATA.quests.active) {
				this.start(questName, "initial")
			}
		},

		// Start quest if it isn't active and hasn't been completed yet.
		start(questName, initial) {
			let quest = this.getQuest(questName)
			if (!quest && !SAVEDATA.quests.completed[questName]) {
				// Load quest properties from json file in the assets folder
				// BEWARE, the quest won't start until this file is finished loading
				// TODO: Load all the quests beforehand? Their titles and descriptions will need to be seen in the quests menu.
				loadJSON(`assets/quests/${questName}.json`, (data) => {
					activeQuests[questName] = {
						name: data.name,
						description: data.description,

						progressDescription: data.progressDescription,

						progress: SAVEDATA.quests.active[questName] || data.progressStart,
						progressFinish: data.progressFinish,

						progressEvents: data.progressEvents,

						reward: data.reward,

						complete: false,
					}

					if (!SAVEDATA.quests.active[questName]) {
						// TODO: There should be a SaveData function for this, saving progress will be more complicated when the database is implemented
						SAVEDATA.quests.active[questName] = activeQuests[questName].progress
					}

						
					Notify.new("You started the quest: " + data.name, 8)
					Notify.new(data.description, 8)
				})
			}
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
							if (type == "minigameHighscore") {
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
								if (event.costGreater) {
									// Is outfit greater/less than defined cost?
									let cost = 0
									if (head) {
										console.log(head)
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

		// Set quest progress slot to a value.
		setProgress(questName, progressSlot, value) {
			let quest = this.getQuest(questName)
			if (quest) {
				quest.progress[progressSlot] = value

				// Save progress
				SAVEDATA.quests.active[questName] = quest.progress

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
			let quest = this.getQuest(questName)
			if (quest) {
				// Give reward(s)
				for (let rewardType in quest.reward) {
					if (rewardType == "nuggets") {
						// Nuggets
						addNuggets(quest.reward[rewardType])
					} else if (rewardType == "item") {
						// Item
						addItem(null, quest.reward[rewardType])
					}
				}

				// Mark as complete
				SAVEDATA.quests.completed[questName] = quest.progress
				delete activeQuests[questName]
				delete SAVEDATA.quests.active[questName]

				// Notify
				Notify.new("You completed the quest: " + quest.name)
			}
		},

		// Return quest progress, if it is active.
		getQuest(questName) {
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
			return {} //SAVEDATA.quests.completed (Not properly formatted)
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