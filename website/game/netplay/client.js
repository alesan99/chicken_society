// Netplay module; Communicates with the server to allow multiplayer

import {SAVEDATA, PROFILE, WORLD, CURSOR} from "../main.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem, placeFurniture, removeFurniture} from "../savedata.js";
import {openMenu, closeMenu, getOpenMenu} from "../state.js";
import {OBJECTS, PLAYER, PLAYER_CONTROLLER, CHARACTER, PHYSICSWORLD, CHAT} from "../world.js";
import Notify from "../gui/notification.js";
import {getState} from "../state.js";
import TimedEventsSystem from "../timedevents.js";
import PetRaceSystem from "../petrace.js";
import { MENUS } from "../menu.js";
import { applySaveData } from "../savedata.js";

var Netplay;
if (typeof io !== "undefined") { // Check if communication module was loaded (it isn't when testing the game)
	// eslint-disable-next-line no-undef
	var socket = io(); // No URL because it defaults to trying to connect to host that serves page

	Netplay = class {
		constructor () {
			// Timing for chicken position or minigame data
			this.updateTimer = 0;
			this.updateInterval = 5/60; //Time inbetween sending data to server

			// Action timings
			/* Two types of actions:
				1. Normal: This will be recieved by the server as soon as possible only when theres little client activity, otherwise it will be added to a queue.
				2. New: This new action will overwrite any old actions in queue.
			*/
			this.actionQueue = [];
			this.actionTimer = 0;
			this.actionInterval = 5/60; // Minimum time inbetween sending actions to server

			this.timeOut = 10000; // Give up sending an important message after this amount of time (sec.)

			// Other Clients (lets call them players)
			// Format (as of 3/18/2025):
			/* {
				id: playerData.id,
				state: playerData.state,
				minigame: playerData.minigame,
				area: playerData.area,
				profile: playerData.profile,
				name: playerData.name,
				chicken: playerData.chicken,
				pet: {
					name
					happiness
					health
					hunger
				}
			} */
			this.playerList = {};

			this.mutedPlayers = {}; // Which playerIDs not to recieve updates from

			// This Client
			this.connect();
			this.id = socket.id; // Socket ID
			this.isConnected = true; // Still connected to server
			this.admin = false; // Can you use chat commands?

			// Savedata and autosave
			this.lastSaved = new Date();
			this.autoSaveWaitTime = 30; // Only autosave every 30 seconds.

			// Chicken syncing information
			this.oldx = 0;
			this.oldy = 0;
			this.oldsx = 0;
			this.oldsy = 0;
			this.newPlayerJoined = false;

			// Minigame syncing
			this.minigame = false;
			this.minigameName = false;
			this.minigamePlayerList = {};
			this.oldMinigameData = false;
			this.role = "player";

			// Pet race syncing
			this.petRaceStarted = false;
			this.petRaceData = []; // List of 4 max pets that are in pet race {"pet": "petItemId", "name": "string", "x": 0, "y": 0, "sx": 0, "sy": 0, "id": "playerId}

			// Events //
			// Players joining
			socket.on("playerList", (playerList) => {this.recievePlayerList(playerList);});
			socket.on("addPlayer", (id, playerData) => {this.addPlayer(id, playerData, false);});
			socket.on("removePlayer", (id) => {this.removePlayer(id);});
			// Global player events
			socket.on("chat", (id, text) => {this.recieveChat(id, text);});
			socket.on("updateProfile",(id, profile) => {this.recieveProfile(id, profile);});
			socket.on("updatePetProfile",(id, profile) => {this.recievePetProfile(id, profile);});
			socket.on("area", (id, area, x, y) => {this.recieveArea(id, area, x, y);});
			// Area player events
			socket.on("chicken", (id, x, y, sx, sy) => {this.recievePosition(id, x, y, sx, sy);});
			socket.on("action", (id, actions) => {this.recieveAction(id, actions);});
			socket.on("addNuggets", (nuggets) => {this.recieveAddNuggets(nuggets);});
			socket.on("giveItem", (item) => {this.recieveGiveItem(item);});
			// Server events
			socket.on("notify", (text, duration, color) => {this.recieveNotificaton(text, duration, color);});
			// Minigame events
			socket.on("minigameRole", (id, role, playerList) => {this.recieveMinigameRole(id, role, playerList);});
			socket.on("minigame", (id, data) => {this.recieveMinigameData(id, data);});
			socket.on("minigameAddPlayer", (id) => {this.addMinigamePlayer(id);});
			socket.on("minigameRemovePlayer", (id) => {this.removeMinigamePlayer(id);});
			socket.on("minigameHighscores", (id, data) => {this.recieveMinigameHighscores(id, data);});
			// Timed Events
			socket.on("timedEvents", (timedEvents) => {this.recieveTimedEvents(timedEvents);});
			// Pet Race
			socket.on("petRaceData", (data) => {this.recievePetRaceData(data);});
			socket.on("petRaceFinish", (pet) => {});
			// Coop
			// Save data
			socket.on("loggedIn", (data) => {this.loggedIn(data);})
			// Server connections
			socket.on("disconnect", (reason) => {this.disconnect(reason);});
			socket.io.on("reconnect", () => {this.reconnect();});
		}

		// Connect to server for the first time and send information about yourself
		connect() {
			// Send profile (Chicken's appearance)
			return new Promise((resolve, reject) => {
				socket.timeout(this.timeOut).emit("profile", PROFILE, (err, response) => {
					if (err) {
						// the other side did not acknowledge the event in the given delay
						resolve(false);
					} else {
						console.log(`Successfully connected to server! Status: ${response.status}`);

						// Update server on other information
						if (PROFILE.pet) {
							this.sendPetProfile(SAVEDATA.pet);
						}

						resolve(true);
					}
				});
			});
		}

		disconnect(reason) {
			console.error(`Disconnected: ${reason}`);
			Notify.new("Disconnected from server!", 10, [200, 0, 0]);

			// Clear player list
			for (const [id, playerData] of Object.entries(this.playerList)) {
				this.removePlayer(id);
				this.removeMinigamePlayer(id);
			}
		}

		reconnect() {
			this.connect().then((success) => {
				if (success) {
					Notify.new("Reconnected!");
				} else {
					Notify.new("Could not reconnect.\nPlease refresh.", 10, [200, 0, 0]);
				}
			});
		}

		update(dt) {
			this.updateTimer += dt;
			// Continually let server know where this client's chicken is, or what their minigame is doing
			if (this.updateTimer > this.updateInterval) {
				if (getState() == "world") { // World
					// Send chicken position to server
					// Get velocity of player
					let [sx, sy] = [PLAYER.sx, PLAYER.sy];
					//let [sx, sy] = [(PLAYER.x-this.oldx)/this.updateInterval, (PLAYER.y-this.oldy)/this.updateInterval]
					// Check if position has changed since last time position was sent to the server (or if there is a new player that needs this info.)
					let [x, y, ox, oy] = [Math.floor(PLAYER.x), Math.floor(PLAYER.y), Math.floor(this.oldx), Math.floor(this.oldy)];
					if ((x != ox) || (y != oy) || (sx != this.oldsx) || (sy != this.oldsy) || (this.newPlayerJoined == true)) {
						socket.volatile.emit("chicken", x, y, sx, sy);
						this.newPlayerJoined = false; // TODO: This should be handled by the server
					}
					this.oldx = x;
					this.oldy = y;
					this.oldsx = sx;
					this.oldsy = sy;
				} else if (getState() == "minigame") { // Playing minigame
					// Send minigame data to server
					this.sendMinigameData(this.minigame.data);
				}

				this.updateTimer = this.updateTimer%this.updateInterval;
			}

			// Continually send actions. Unlike the information above, actions can be sent instantly so long as this client hasn't sent any action in the last X seconds
			this.actionTimer += dt;
			if (this.actionTimer > this.actionInterval) {
				if (this.actionQueue.length > 0) {
					socket.emit("action", this.actionQueue);
					this.actionQueue.length = 0; // Clear action queue
					this.actionTimer = this.actionTimer%this.actionInterval;
				}
			}

		}

		// Add new playerData entry to playerList
		addPlayer(id, playerData, isInitial=false) {
			if ((id != socket.id) && (this.playerList[id] == null)) {
				this.playerList[id] = playerData;

				// Add player to area (in world.js)
				// if isInitial (You are joining and getting the player data for the first time), don't show others as spawning
				WORLD.addPlayerToArea(id, this.playerList[id], !isInitial);
				this.newPlayerJoined = true; // New player! Let them know your information

				// Add to connected player list, if open
				let open_menu = getOpenMenu();
				if (open_menu == "usersMenu") {
					MENUS[open_menu].generateConnectedPlayersList();
				}
			}
		}

		// Remove playerData entry from playerList
		removePlayer(id) {
			if (id != socket.id) {
				WORLD.removePlayerFromArea(id);
				delete this.playerList[id];
			
				// Add to connected player list, if open
				let open_menu = getOpenMenu();
				if (open_menu == "usersMenu") {
					MENUS[open_menu].generateConnectedPlayersList();
				}
			}
		}

		// Recieve entire list of players when connecting for the first time
		recievePlayerList(playerList) {
			console.log("Recieved Player List:");
			console.log(playerList);
			for (const [id, playerData] of Object.entries(playerList)) {
				if ((id != socket.id) && (this.playerList[id] == null)) {
					this.addPlayer(id, playerData, true);
				}
			}
		}

		// Recive player data from server and reflect changes
		recievePosition(id, x, y, sx, sy) {
			if (this.playerList[id] != null) {
				let chicken = this.playerList[id].chicken;
				chicken.x = x;
				chicken.y = y;

				// Update player's character object
				if (CHARACTER[id]) {
					// Position and speed
					CHARACTER[id].setPosition(chicken.x, chicken.y);
					CHARACTER[id].move(sx/CHARACTER[id].speed, sy/CHARACTER[id].speed);
				}
			}
		}

		// Send chat to everyone
		sendChat(text) {
			socket.emit("chat", text);
		}

		recieveChat(id, text) {
			if (this.mutedPlayers[id]) {
				return false;
			}

			let playerData = this.playerList[id];
			if (playerData != null) {
				let display = false;
				if ((PLAYER.area != this.playerList[id].area) || (this.minigame)) { // Display chat message in chat log if chicken is not visible
					display = true;
				}
				CHAT.message(text, this.playerList[id].name, display);
				CHARACTER[id].speechBubble(text);
			}
		}

		// Update Profile when changed
		sendProfile(profile) {
			socket.emit("updateProfile", profile);
		}
		recieveProfile(id, profile) {
			let playerData = this.playerList[id];
			if (playerData != null) {
				playerData.profile = profile;
				playerData.name = profile.name;
				// Update player's character object
				if (CHARACTER[id] != null) {
					CHARACTER[id].updateProfile(profile);
				}
			}
		}

		// Update Pet Information when changed
		sendPetProfile(profile) {
			socket.emit("updatePetProfile", profile);
		}
		recievePetProfile(id, profile) {
			let playerData = this.playerList[id];
			if (playerData != null) {
				// Update player's pet
				playerData.pet = profile;
				if (CHARACTER[id] != null) {
					let chicken = CHARACTER[id];
					if (chicken.petObj) {
						chicken.petObj.updateProfile(profile);
					}
				}
			}
		}

		// Enqueue action
		// Sent to the server as soon as possible if this client hasn't been sent any action in the last X seconds
		// If it has, enqueue action and it will be sent next time this client has an update cycle.
		sendAction(name, ...args) {
			if (this.actionTimer > this.actionInterval) {
				socket.emit("action", [[name, args]]);
				this.actionTimer = 0;
			} else {
				this.actionQueue.push([name, args]);
			}
		}
		sendNewAction(name, ...args) {
		// erase the last update action with same name, if there is one
			if (this.actionQueue.length > 0) {
				for (let i = this.actionQueue.length - 1; i >= 0; i--) {
					if (this.actionQueue[i][0] == name) {
						this.actionQueue.splice(i, 1);
					}
				}
			}
			this.sendAction(name, ...args);
		}

		// Recieve action for another player in same area
		recieveAction(id, actions) {
			let playerData = this.playerList[id];
			if (playerData != null) {
				let chicken = CHARACTER[id];
				if (chicken != null) {
					for (let i in actions) {
					// Handle individual actions
						let action = actions[i];
						let name = action[0];
						let args = action[1];
						switch (name) {
						// Player emoted
						case "emote":
							chicken.emote(args[0]);
							break;
						// Player got a status effect
						case "statusEffect":
							// args = [name, timer]
							console.log("Recieved status effect:", args);
							chicken.startStatusEffect(args[0], args[1]);
							break;
						case "shoot":
							// args = [nx, ny]
							chicken.shoot(args[0], args[1]);
							break;
						case "jump":
							// args = [jumpHeight]
							chicken.jump(args[0]);
							break;
						case "disappear":
							chicken.disappear();
							break;
						}
					}
				}
			}
		}

		//Area
		sendArea(area, ownerId, x, y) {
			socket.emit("area", area, ownerId, x, y);
		}
		recieveArea(id, area, x, y) {
			if (this.playerList[id] != null) {
				this.playerList[id].area = area;
				let chicken = this.playerList[id].chicken;
				chicken.x = x;
				chicken.y = y;

				// Add player to area (in world.js)
				WORLD.addPlayerToArea(id, this.playerList[id], true);
			}
		}

		// Server Events
		recieveNotificaton(text, duration, color) {
			Notify.new(text, duration, color);
		}

		// Minigames
		// Tell server if client started playing minigame
		sendMinigame(minigame, minigameName=false) {
			this.minigame = minigame;
			this.minigameName = minigameName;
			if (this.minigame) {
				// Connecting to minigame
				this.minigamePlayerList = {};
				socket.timeout(this.timeOut).emit("minigame", minigameName, (err, response) => { if (err) { } else { console.log(response); } });
			} else {
				// Disconnecting from minigame
				socket.timeout(this.timeOut).emit("minigame", false, (err, response) => { if (err) {} else { console.log(response); } });
			}
		}
		// Server will assign you a role in a minigame.
		// host: You are the first player to start this minigame. Everyone will see the same thing that's happening in your game.
		// player: Other people are already playing this minigame. You will only see what the host is experiencing while you let them know what you are doing.
		// spectator: You are seeing what the host is seeing. You have no influence and have to send no data to them.
		// TODO: If the host leaves, either kick everyone out or assign a new host
		recieveMinigameRole(role, minigamePlayerList) {
			console.log("Recieved minigame role:", role);
			this.role = role;
			this.minigamePlayerList = {};

			// Add each player listed in the minigame player list
			for (const [id, playerData] of Object.entries(minigamePlayerList)) {
				this.addMinigamePlayer(id);
			}

			// The function above creates the minigamePlayerList, but this will fill it in with data from the server
			this.minigamePlayerList = minigamePlayerList;
		}
		getMinigameRole() {
			return this.role;
		}
		getMinigamePlayers() {
			return this.minigamePlayerList;
		}
		addMinigamePlayer (id) {
			let playerData = this.playerList[id];
			if ((id != socket.id) && (playerData) && (this.minigamePlayerList[id] == null)) {
				console.log("Player joined minigame:", playerData.name);
				// Initialize minigame data
				this.minigamePlayerList[id] = {};
				this.minigame.playerData[id] = {};

				// Let minigame know a player joined
				if (this.minigame.addPlayer) {
					this.minigame.addPlayer(id);
				}
			}
		}
		removeMinigamePlayer (id) {
			let playerData = this.playerList[id];
			if (playerData && (id != socket.id)) {
				if (!this.minigame || !this.minigamePlayerList[id]) {
					return false;
				}

				console.log("Attempting to remove player from minigame", playerData.name);
				// Let minigame know a player left
				if (this.minigame.removePlayer) {
					this.minigame.removePlayer(id);
				}

				// Delete all of their minigame-related data
				delete this.minigamePlayerList[id];
				delete this.minigame.playerData[id];
			}
		}
		// Send current minigame data in two ways:
		// As a competitor: Just send your own data to the server
		// Example: You join a race. The host (either another client or the server) will tell you what obstacles are spawning.
		// As a host: Assumes this client is the host of the game, this client decides what is happening in the minigame and every other player's minigame will reflect that.
		// Example: You invite others to race with you. Obstacles randomly spawn on your screen, you will let the other clients know what spawned so the same thing shows up for them.
		sendMinigameData(data) {
			let dataToSend = {};
			let dataChanged = false;

			// Check for differences between old and new data
			for (let key in data) {
				if (data[key] !== this.oldMinigameData[key]) {
					dataToSend[key] = data[key];
					dataChanged = true;
				}
			}

			if (dataChanged) {
				this.oldMinigameData = Object.assign({}, data); // Create shallow copy to compare with next time
				socket.volatile.emit("minigameData", this.minigameName, dataToSend);
			}
		}
		recieveMinigameData(id, newData) {
			if (this.minigame && this.minigame.playerData[id]) {
				let data = this.minigame.playerData[id];
				for (const [key, value] of Object.entries(newData)) {
					if (data[key] != value) {
						data[key] = value;
					}
				}
			}
		}
		// sendMinigameHighscore(highscore) {
		// 	socket.volatile.emit("minigameHighscore", this.minigameName, highscore)
		// }
		recieveMinigameHighscores(data) {
			if (this.minigame && this.minigame.highscores) {
				console.log("Recieved new highscores!", data);
				this.minigame.highscores = data;
			}
		}

		// Mute player
		// This disables visibility of a player and their actions
		mutePlayer(id, doMute) {
			let playerData = this.playerList[id];
			if (playerData) {
				if (doMute) { // Mute
					this.mutedPlayers[id] = true;
					Notify.new(`Muted ${playerData.name}.`, 2);
				} else { // Unmute
					if (this.mutedPlayers[id]) {
						delete this.mutedPlayers[id];
					}
					Notify.new(`Unmuted ${playerData.name}.`, 2);
				}
				return true;
			} else { // Error
				Notify.new("Can't mute this player.", 2, [255, 0, 0]);
				return false;
			}
		}

		// Get player data from player data list
		getPlayerData(id) {
			return this.playerList[id];
		}

		// Timed Events
		recieveTimedEvents(timedEvents) {
			console.log("Recieved timed events:", timedEvents);
			TimedEventsSystem.setActiveTimedEvents(timedEvents);
		}

		// Send message to server
		sendMessageToServer(header, contents) {
			this.sendAction("message", header, contents);
		}

		// Recieve pet race
		recievePetRaceData(data) {
			if (data === false) {
			// Race ended
				this.petRaceData = false;
				this.petRaceStarted = false;
				// Show pet
				PetRaceSystem.end();
				return false;
			}
			let oldRaceStarted = this.petRaceStarted;
			let oldPetRaceDataLen = 0;
			if (this.petRaceData) {
				oldPetRaceDataLen = this.petRaceData.length;
			}
			this.petRaceData = data;
			this.petRaceStarted = data[0];
		
			// There is a new pet in
			if (oldPetRaceDataLen > 0 && this.petRaceData.length > oldPetRaceDataLen) {
				PetRaceSystem.newPet(data);
			}

			// Race has started
			if (this.petRaceStarted && !oldRaceStarted) {
				PetRaceSystem.start();
			}
		}

		// Recieve items
		recieveAddNuggets(nuggets) {
		// Add nuggets to player's inventory
			addNuggets(nuggets);
		}
		recieveGiveItem(item, count=1) {
		// Add item to player's inventory
			Notify.new(`You recieved ${item.name} (${count}).`, 5);
			addItem(item, null, count);
		}

		// Get coop data
		sendCoopData() {
			socket.emit("updateCoopData", SAVEDATA.coop, (response) => {
				if (response.success) {
					console.log("Coop data saved successfully.");
				} else {
					console.error("Failed to save coop data:", response.error);
				}
			});
		}
		requestCoopData(id, callback) {
			socket.emit("requestCoopData", id, (response) => {
				if (response.success) {
					console.log("Recieved coop data:", response.data);
					callback(response.data);
				} else {
					console.error("Failed to save coop data:", response.error);
					callback(false);
				}
			});
		}

		// Get save data
		sendSaveData(SaveData, callback) {
			socket.emit("updateSaveData", SaveData, (response) => {
				if (response.success) {
					this.lastSaved = new Date();
					console.log("SaveData saved successfully.");
					if (callback) {
						callback();
					}
				} else {
					console.error("Failed to save saveData:", response.error);
				}
			});
		}
		requestSaveData(callback) {
			console.log("Requesting saveData from server...");
			socket.emit("requestSaveData", (response) => {
				if (response.success) {
					console.log("Recieved saveData:", response.data);
					callback(response.data);
				} else {
					console.error("Failed to get saveData:", response.error);
					callback(false);
				}
			});
		}
		loggedIn(data) {
			if (data) {
				Notify.new(`Welcome, ${data.username}!`);
				const savedata = data.savedata;
				if (savedata) {
					applySaveData(savedata);
				}
				const admin = data.admin;
				if (admin) {
					this.admin = true;
				}
			}
		}
	};

} else {
	// Fallback; This is just so the game doesn't crash if its running without a server
	Netplay = class {
		constructor () {
			this.id = "OFFLINE";
			this.admin = true;
		}
		connect () {}
		update (dt) {}
		addPlayer (id, player, isInitial) {}
		removePlayer (id) {}
		getPlayerList (playerList) {}
		recievePosition (id, position) {}
		sendAction() {}
		sendNewAction() {}
		recieveAction() {}
		sendChat (text) {}
		recieveChat (id, text) {}
		sendProfile(profile) {}
		recieveProfile(id, profile) {}
		sendPetProfile(profile) {}
		recievePetProfile(id, profile) {}
		sendEmote(emote) {}
		recieveEmote(id, emote) {}
		sendArea(area) {}
		recieveArea(id, area, x, y) {}
		sendMinigame(minigameName) {}
		mutePlayer(id, doMute) {}
		getPlayerData(id) {}
		sendMessageToServer(header, contents) {}
		sendCoopData() {}
		requestCoopData(callback) {}
		sendSaveData() {}
		requestSaveData() {}
		loggedIn(data) {}
	};
}

export default Netplay;