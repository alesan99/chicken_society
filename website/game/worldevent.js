const WorldEvent = (function() {
	const functions = {
		event(name, ...args) {
			if (name == "minigame") {
				// Start minigame
				func = function() {
					// Does this trigger cost something?
					if (trig.cost) {
						removeNuggets(trig.cost);
					}

					AudioSystem.fadeOutMusic(1);
					world.areaMusicPosition = AudioSystem.getMusicPosition();
					PLAYER_CONTROLLER.stop();
					PLAYER.static = true; // Don't let player move
					Transition.start("wipeLeft", "out", 0.8, null, () => {
						OBJECTS["Trigger"][name].reset();
						setState(MINIGAME, trig.minigameName); // Start minigame after transition
						Transition.start("wipeRight", "in", 0.8, null, null);
					});
				};
			} else if (name == "quest") {
				// Progress quest
				func = function() {
					if (trig.questTaskAdd) {
						QuestSystem.progress(trig.quest, trig.questTask, trig.questTaskAdd);
					} else if (trig.questTaskSet) {
						QuestSystem.setProgress(trig.quest, trig.questTask, trig.questTaskSet);
					}
				};
			} else if (name == "dialogue") {
				// Start dialogue
				func = function() {
					DialogueSystem.start(trig.dialogue);
					OBJECTS["Trigger"][name].reset();
				};
			} else if (name == "warp") {
				// Warp to another area
				func = function() {
					WORLD.warpToArea(trig.area, name, PLAYER);
				};
			} else if (name == "item") {
				// Give item
				addItem(trig.item);
			}

			if (rewardType == "nuggets") {
				// Nuggets
				addNuggets(quest.reward[rewardType]);
			} else if (rewardType == "item") {
				// Item
				addItem(quest.reward[rewardType]);
			} else if (rewardType == "quest") {
				// Start new quest
				let questName = quest.reward[rewardType];
				this.start(questName);
			}

			// Start a quest
			if (d.startQuest) {
				QuestSystem.start(d.startQuest);
			}

			// Quest progress from talking
			if (d.quest) {
				if (d.questTaskAdd) {
					QuestSystem.progress(d.quest, d.questTask, d.questTaskAdd);
				} else if (d.questTaskSet) {
					QuestSystem.setProgress(d.quest, d.questTask, d.questTaskSet);
				}
			}

			// Warp
			if (d.warp) {
				WORLD.warpToArea(d.warp, d.fromWarp || "dialogue", PLAYER);
			}

			// Give item
			if (d.giveItem) {
				addItem(d.giveItem);
			}

			// Send a message to the server
			if (d.sendServerMessage) {
				let header = d.serverMessageHeader;
				let message = serverMessage;
				NETPLAY.sendMessageToServer(header, message);
			}
		}
	};
	
	return functions; })();

export { WorldEvent };