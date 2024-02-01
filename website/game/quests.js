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

						progress: SAVEDATA.quests.active[questName] || data.progressStart,
						progressFinish: data.progressFinish,

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
				switch (type) {
					case "highscore":
						// args: minigame, score
						break
					case "talk":
						// args: npc
						break
					case "outfit":
						// args: head, face, body
						break
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

		// Print all active quest for testing purposes myes
		debug() {
			for (let questName in activeQuests) {
				let quest = activeQuests[questName]
				let progressString = ""
				for (let i=0; i<quest.progress.length; i++) {
					progressString += `${quest.progress[i]}/${quest.progressFinish[i]} `
				}
				console.log(`${questName}: ${progressString}`)
			}
		}
	};
	
return functions; })()