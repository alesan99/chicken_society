// Netplay module; Communicates with the server to allow multiplayer
var Netplay
if (typeof io !== 'undefined') { // Check if communication module was loaded (it isn't when testing the game)
var socket = io(); // No URL because it defaults to trying to connect to host that serves page

Netplay = class {
	constructor () {
		// Communication timings
		/* Three types of communication:
		Update: This is information consistently sent on an interval to the server. May appear laggy and may not be recieved by the server.
		Action: This is information is sent instantly to the server if possible, and otherwise will be bundled together then sent. This WILL be recieved by the server.
		Urgent: This is information is sent instantly to the server. This can only be done once within a time frame and it may not be recieved by the server.
		TODO: This system is not implemented yet
		*/
		this.actionQueue = []
		this.updateTimer = 0
		this.updateInterval = 5/60 //Time inbetween sending data to server
		this.updateTimestamp = 0 // When was the last time there was an update?

		this.urgentQueue = []
		this.urgentTimer = 0
		this.urgentTime = 5/60 // Information can also be sent instantly so long as a message wasn't previously sent within this time.

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
		socket.on("addPlayer", (id, player) => {this.addPlayer(id, player)}) // currently unused
		socket.on("removePlayer", (id) => {this.removePlayer(id)}) // currently unused

		socket.on("chat", (id, text) => {this.recieveChat(id, text)})
		socket.on("updateProfile",(id, profile) => {this.recieveProfile(id, profile)})

		socket.on("chicken", (id, position) => {this.recievePosition(id, position)})
		socket.on("emote", (id, emote) => {this.recieveEmote(id, emote)})
		socket.on("area", (id, area) => {this.recieveArea(id, area)})

		socket.on("minigameRole", (id, role, playerList) => {this.recieveMinigameRole(id, role, playerList)})
		socket.on("minigame", (id, data) => {this.recieveMinigameData(id, data)})
		socket.on("minigameAddPlayer", (id) => {this.addMinigamePlayer(id)})
		socket.on("minigameRemovePlayer", (id) => {this.removeMinigamePlayer(id)})
	}

	// Connect to server for the first time and send information about yourself
	connect () {
		socket.timeout(this.timeOut).emitWithAck("profile", PROFILE, (err, val) => {
			console.log("could not connect to server :(")
		});
	}

	update (dt) {
		this.updateTimestamp += dt
		this.updateTimer += dt
		// Continually let server know what's happening
		if (this.updateTimer > this.updateInterval) {
			if (getState() == "world") { // World
				// Send chicken position to server
				// Get velocity of player
				let [sx, sy] = [PLAYER.sx, PLAYER.sy]
				//let [sx, sy] = [(PLAYER.x-this.oldx)/this.updateInterval, (PLAYER.y-this.oldy)/this.updateInterval]
				// Check if position has changed since last time position was sent to the server (or if there is a new player that needs this info.)
				let [x, y, ox, oy] = [Math.floor(PLAYER.x), Math.floor(PLAYER.y), Math.floor(this.oldx), Math.floor(this.oldy)]
				if ((x != ox) || (y != oy) || (sx != this.oldsx) || (sy != this.oldsy) || (this.newPlayerJoined == true)) {
					socket.volatile.emit("chicken", [x, y, sx, sy])
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

			this.updateTimestamp = 0
			this.updateTimer = this.updateTimer%this.updateInterval
		}
	}

	addPlayer (id, playerData) {
		if ((id != socket.id) && (this.playerList[id] == null)) {
			this.playerList[id] = playerData
			// TODO: move this code to world.js?
			let chicken = playerData.chicken
			CHARACTER[id] = new Character(PHYSICSWORLD, chicken.x, chicken.y, playerData.profile, playerData.area)
			//CHARACTER[id].active = false // Disable collision checks. Should be enabled so collision is accurate even when information isn't being recieved.
			this.newPlayerJoined = true // New player! Let them know your information
		}
	}

	removePlayer (id) {
		if (id != socket.id) {
			CHARACTER[id].destroy()
			delete CHARACTER[id]
			delete this.playerList[id]
		}
	}

	// Recieve entire list of players when connecting for the first time
	recievePlayerList (playerList) {
		console.log("recieved playerList")
		for (const [id, playerData] of Object.entries(playerList)) {
			console.log(id, playerData.profile.name)
			if ((id != socket.id) && (this.playerList[id] == null)) {
				this.addPlayer(id, playerData)
			}
		}
	}

	// Recive player data from server and reflect changes
	recievePosition (id, position) {
		if (CHARACTER[id]) {
			// Position and speed
			CHARACTER[id].setPosition(position[0], position[1])
			CHARACTER[id].move(position[2]/CHARACTER[id].speed, position[3]/CHARACTER[id].speed)
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
			CHARACTER[id].chatBubble(text)
		}
	}

	// Update Profile when changed
	sendProfile(profile) {
		socket.emit("updateProfile", profile)
	}
	recieveProfile(id, profile) {
		console.log("received profile", profile)
		if (CHARACTER[id] != null) {
			CHARACTER[id].updateProfile(profile)
		}
	}

	//Emote
	sendEmote(emote) {
		socket.emit("emote", emote)
	}
	recieveEmote(id, emote) {
		console.log("recieved emote", emote)
		if (CHARACTER[id] != null) {
			CHARACTER[id].emote(emote)
		}
	}

	//Area
	sendArea(area) {
		socket.emit("area", area)
	}
	recieveArea(id, area) {
		console.log("recieved area", id, area)
		if (this.playerList[id] != null) {
			this.playerList[id].area = area
			CHARACTER[id].area = area
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
			socket.timeout(this.timeOut).emitWithAck("minigame", minigameName, (err, val) => {
				console.log("could not connect to server :(")
			});
		} else {
			// Disconnecting from minigame
			socket.timeout(this.timeOut).emitWithAck("minigame", false, (err, val) => {
				console.log("could not connect to server :(")
			});
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
		socket.volatile.emit("minigameData", this.minigameName, data)
	}
	recieveMinigameData(id, data) {
		if (this.minigame && this.minigame.playerData[id]) {
			this.oldMinigameData = data
			this.minigame.playerData[id] = data
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