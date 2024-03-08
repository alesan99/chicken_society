// Netplay module; Communicates with the server to allow multiplayer
var Netplay
if (typeof io !== 'undefined') { // Check if communication module was loaded (it isn't when testing the game)
var socket = io(); // No URL because it defaults to trying to connect to host that serves page

Netplay = class {
	constructor () {
		// Timing for chicken position or minigame data
		this.updateTimer = 0
		this.updateInterval = 5/60 //Time inbetween sending data to server

		// Action timings
		/* Two types of actions:
		1. Normal: This will be recieved by the server as soon as possible only when theres little client activity, otherwise it will be added to a queue.
		2. New: This new action will overwrite any old actions in queue.
		TODO: This system is not implemented yet
		*/
		this.actionQueue = []
		this.actionTimer = 0
		this.actionInterval = 5/60 // Minimum time inbetween sending actions to server

		this.timeOut = 10000 // Give up sending an important message after this amount of time (sec.)

		// Other Clients (lets call them players)
		this.playerList = {}

		// This Client
		this.connect()

		// Chicken syncing information
		this.oldx = 0
		this.oldy = 0
		this.oldsx = 0
		this.oldsy = 0
		this.newPlayerJoined = false

		// Minigame syncing
		this.minigame = false
		this.minigameName = false
		this.minigamePlayerList = {}
		this.oldMinigameData = false
		this.role = "player"

		// Events
		socket.on("playerList", (playerList) => {this.recievePlayerList(playerList)})
		socket.on("addPlayer", (id, playerData) => {this.addPlayer(id, playerData)})
		socket.on("removePlayer", (id) => {this.removePlayer(id)})

		socket.on("chat", (id, text) => {this.recieveChat(id, text)})
		socket.on("updateProfile",(id, profile) => {this.recieveProfile(id, profile)})

		socket.on("chicken", (id, x, y, sx, sy) => {this.recievePosition(id, x, y, sx, sy)})
		socket.on("action", (id, actions) => {this.recieveAction(id, actions)})
		socket.on("area", (id, area) => {this.recieveArea(id, area)})

		socket.on("minigameRole", (id, role, playerList) => {this.recieveMinigameRole(id, role, playerList)})
		socket.on("minigame", (id, data) => {this.recieveMinigameData(id, data)})
		socket.on("minigameAddPlayer", (id) => {this.addMinigamePlayer(id)})
		socket.on("minigameRemovePlayer", (id) => {this.removeMinigamePlayer(id)})
		socket.on("minigameHighscores", (id, data) => {this.recieveMinigameHighscores(id, data)})
	}

	// Connect to server for the first time and send information about yourself
	connect () {
		// Send profile (Chicken's appearance)
		socket.timeout(this.timeOut).emit("profile", PROFILE, (err, response) => {
			if (err) {
				// the other side did not acknowledge the event in the given delay
			} else {
				console.log(`Successfully connected to server! Status: ${response.status}`);
			}
		});
	}

	update (dt) {
		this.updateTimer += dt
		// Continually let server know where this client's chicken is, or what their minigame is doing
		if (this.updateTimer > this.updateInterval) {
			if (getState() == "world") { // World
				// Send chicken position to server
				// Get velocity of player
				let [sx, sy] = [PLAYER.sx, PLAYER.sy]
				//let [sx, sy] = [(PLAYER.x-this.oldx)/this.updateInterval, (PLAYER.y-this.oldy)/this.updateInterval]
				// Check if position has changed since last time position was sent to the server (or if there is a new player that needs this info.)
				let [x, y, ox, oy] = [Math.floor(PLAYER.x), Math.floor(PLAYER.y), Math.floor(this.oldx), Math.floor(this.oldy)]
				if ((x != ox) || (y != oy) || (sx != this.oldsx) || (sy != this.oldsy) || (this.newPlayerJoined == true)) {
					socket.volatile.emit("chicken", x, y, sx, sy)
					this.newPlayerJoined = false // TODO: This should be handled by the server
				}
				this.oldx = x
				this.oldy = y
				this.oldsx = sx
				this.oldsy = sy
			} else if (getState() == "minigame") { // Playing minigame
				// Send minigame data to server
				this.sendMinigameData(this.minigame.data)
			}

			this.updateTimer = this.updateTimer%this.updateInterval
		}

		// Continually send actions. Unlike the information above, actions can be sent instantly so long as this client hasn't sent any action in the last X seconds
		this.actionTimer += dt
		if (this.actionTimer > this.actionInterval) {
			if (this.actionQueue.length > 0) {
				console.log("Sending action queue")
				socket.emit("action", this.actionQueue)
				this.actionQueue.length = 0 // Clear action queue
				this.actionTimer = this.actionTimer%this.actionInterval
			}
		}

	}

	// Add new playerData entry to playerList
	addPlayer (id, playerData) {
		if ((id != socket.id) && (this.playerList[id] == null)) {
			this.playerList[id] = playerData

			// Add player to area (in world.js)
			WORLD.addPlayerToArea(id, this.playerList[id])
			this.newPlayerJoined = true // New player! Let them know your information
		}
	}

	// Remove playerData entry from playerList
	removePlayer (id) {
		if (id != socket.id) {
			WORLD.removePlayerFromArea(id)
			delete this.playerList[id]
		}
	}

	// Recieve entire list of players when connecting for the first time
	recievePlayerList (playerList) {
		console.log("Recieved Player List:")
		console.log(playerList)
		for (const [id, playerData] of Object.entries(playerList)) {
			if ((id != socket.id) && (this.playerList[id] == null)) {
				this.addPlayer(id, playerData)
			}
		}
	}

	// Recive player data from server and reflect changes
	recievePosition (id, x, y, sx, sy) {
		if (this.playerList[id] != null) {
			let chicken = this.playerList[id].chicken
			chicken.x = x
			chicken.y = y

			// Update player's character object
			if (CHARACTER[id]) {
				// Position and speed
				CHARACTER[id].setPosition(chicken.x, chicken.y)
				CHARACTER[id].move(sx/CHARACTER[id].speed, sy/CHARACTER[id].speed)
			}
		}
	}

	// Send chat to everyone
	// TODO: Word filter
	sendChat (text) {
		socket.emit("chat", text)
	}

	recieveChat (id, text) {
		console.log("recieved chat", text)
		if (this.playerList[id] != null) {
			let display = false
			if ((PLAYER.area != this.playerList[id].area) || (this.minigame)) { // Display chat message in chat log if chicken is not visible
				display = true
			}
			CHAT.message(text, this.playerList[id].name, display)
			CHARACTER[id].speechBubble(text)
		}
	}

	// Update Profile when changed
	sendProfile(profile) {
		socket.emit("updateProfile", profile)
	}
	recieveProfile(id, profile) {
		let playerData = this.playerList[id]
		if (playerData != null) {
			playerData.profile = profile
			// Update player's character object
			if (CHARACTER[id] != null) {
				CHARACTER[id].updateProfile(profile)
			}
		}
	}

	// Enqueue action
	// Sent to the server as soon as possible if this client hasn't been sent any action in the last X seconds
	// If it has, enqueue action and it will be sent next time this client has an update cycle.
	sendAction(name, ...args) {
		console.log(name, args)
		if (this.actionTimer > this.actionInterval) {
			console.log(`Sent action: ${name}`)
			socket.emit("action", [[name, args]])
			this.actionTimer = 0
		} else {
			console.log(`Enqueued action: ${name}. ${this.actionTimer}, ${this.actionInterval}`)
			this.actionQueue.push([name, args])
		}
	}
	sendNewAction(name, ...args) {
		// erase the last update action with same name, if there is one
		if (this.actionQueue.length > 0) {
			for (let i = this.actionQueue.length - 1; i >= 0; i--) {
				if (this.actionQueue[i][0] == name) {
					this.actionQueue.splice(i, 1)
				}
			}
		}
		this.sendAction(name, ...args)
	}

	// Recieve action for another player in same area
	recieveAction(id, actions) {
		let playerData = this.playerList[id]
		if (playerData != null) {
			console.log(`Recieved actions from ${playerData.name}`)
			let chicken = CHARACTER[id]
			if (chicken != null) {
				for (let i in actions) {
					// Handle individual actions
					let action = actions[i]
					let name = action[0]
					let args = action[1]
					switch (name) {
						// Player emoted
						case "emote":
							chicken.emote(args[0])
							break;
						// Player got a status effect
						case "statusEffect":
							chicken.startStatusEffect(args[0], args[1])
							break;
					}
				}
			}
		}
	}

	//Area
	sendArea(area) {
		socket.emit("area", area)
	}
	recieveArea(id, area) {
		if (this.playerList[id] != null) {
			this.playerList[id].area = area

			// Add player to area (in world.js)
			WORLD.addPlayerToArea(id, this.playerList[id])
		}
	}

	// Minigames
	// Tell server if client started playing minigame
	sendMinigame(minigame, minigameName=false) {
		this.minigame = minigame
		this.minigameName = minigameName
		if (this.minigame) {
			// Connecting to minigame
			this.minigamePlayerList = {}
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
		console.log("Recieved minigame role:", role)
		this.minigamePlayerList = minigamePlayerList
		this.role = role

		// Add each player listed in the minigame player list
		for (const [id, playerData] of Object.entries(minigamePlayerList)) {
			if (id != socket.id) {
				// TODO: don't copypaste code
				console.log("Player joined minigame:", id)
				// Initialize minigame data
				this.minigamePlayerList[id] = {}
				this.minigame.playerData[id] = {}
	
				// Let minigame know a player joined
				if (this.minigame.addPlayer) {
					this.minigame.addPlayer(id)
				}
				// this.addMinigamePlayer(id)
			}
		}
	}
	getMinigameRole() {
		return this.role
	}
	getMinigamePlayers() {
		return this.minigamePlayerList
	}
	addMinigamePlayer (id) {
		if ((id != socket.id) && (this.minigamePlayerList[id] == null)) {
			console.log("Player joined minigame:", id)
			// Initialize minigame data
			this.minigamePlayerList[id] = {}
			this.minigame.playerData[id] = {}

			// Let minigame know a player joined
			if (this.minigame.addPlayer) {
				this.minigame.addPlayer(id)
			}
		}
	}
	removeMinigamePlayer (id) {
		if (id != socket.id) {
			console.log("Attempting to remove player from minigame", id)
			// Let minigame know a player left
			if (this.minigame.removePlayer) {
				this.minigame.removePlayer(id)
			}

			// Delete all of their minigame-related data
			delete this.minigamePlayerList[id]
			delete this.minigame.playerData[id]
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
			this.oldMinigameData = Object.assign({}, data);
			socket.volatile.emit("minigameData", this.minigameName, dataToSend);
		}
	}
	recieveMinigameData(id, newData) {
		if (this.minigame && this.minigame.playerData[id]) {
			let data = this.minigame.playerData[id]
			for (const [key, value] of Object.entries(newData)) {
				if (data[key] != value) {
					data[key] = value
				}
			}
		}
	}
	// sendMinigameHighscore(highscore) {
	// 	socket.volatile.emit("minigameHighscore", this.minigameName, highscore)
	// }
	recieveMinigameHighscores(data) {
		if (this.minigame && this.minigame.highscores) {
			console.log("Recieved new highscores!", data)
			this.minigame.highscores = data
		}
	}
}

} else {
	// Fallback; This is just so the game doesn't crash if its running without a server
	Netplay = class {
		constructor () {}
		connect () {}
		update (dt) {}
		addPlayer (id, player) {}
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
		sendEmote(emote) {}
		recieveEmote(id, emote) {}
		sendArea(area) {}
		recieveArea(id, area) {}
		sendMinigame(minigameName) {}
	}
}