// Area
// logic that controls the background and elements of an area

// A "condition" is a property for sprites, triggers, and dialogue options
// It determines if the element should activate if the conditions are met
// Example: "egg" should only appear in an area if the egg Quest is active
function checkCondition(c) {
	console.log(c)
	if (c.quest) {
		let questName = c.quest
		if (questName && QuestSystem.getQuest(questName)) {
			// Quest is active; make sure progress conditions are met
			let progressMet = true

			if (c.questSlot) {
				let slot = c.questSlot
				let value = c.questValue
				// Check if slot is a list of values
				if (!slot.isArray) {
					// turn it into a list for code simplicity
					slot = [slot]
					value = [value]
				}
				for (let i=0; i<slot.length; i++) {
					if (QuestSystem.getProgress(questName, slot[i]) < value[i]) {
						progressMet = false
					}
				}
			}

			return progressMet
		} else if (c.questFinished === false && !SAVEDATA.quests.completed[questName]) {
			// "questFinished" is met if the quest is not active and not complete
			return true
		} else {
			// condition not met
			return false
		}
	}
	return true // No condition was defined, so just activate it anyway
}