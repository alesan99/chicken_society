// Area
// logic that controls the background and elements of an area

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