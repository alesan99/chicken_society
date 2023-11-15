// Netplay module; Communicates with the server to allow multiplayer
var Netplay
if (typeof io !== 'undefined') { // Check if communication module was loaded (it isn't when testing the game)
var socket = io(); // No URL because it defaults to trying to connect to host that serves page

Netplay = class {
	constructor () {
		this.timer = 0
		this.interval = 5/60 //Time inbetween sending data to server

		this.timeOut = 10000 // Give up sending an important message after this amount of time (sec.)

		// Other clients (lets call them players)
		this.playerList = {}

		// Client
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
		socket.on("addPlayer", (id, player) => {this.addPlayer(id, player)})
		socket.on("removePlayer", (id) => {this.removePlayer(id)})

		socket.on("chat", (id, text) => {this.recieveChat(id, text)})
		socket.on("updateProfile",(id, profile) => {this.recieveProfile(id, profile)})

		socket.on("player", (id, position) => {this.recievePosition(id, position)})
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
		// Continually let server know what's happening
		if (getState() == "world") { // World
			// Send chicken position to server
			this.timer += dt
			if (this.timer > this.interval) {
				// Get velocity of player
				let [sx, sy] = [PLAYER.sx, PLAYER.sy]
				// Check if position has changed since last time position was sent to the server (or if there is a new player that needs this info.)
				let [x, y, ox, oy] = [Math.floor(PLAYER.x), Math.floor(PLAYER.y), Math.floor(this.oldx), Math.floor(this.oldy)]
				if ((x != ox) || (y != oy) || (sx != this.oldsx) || (sy != this.oldsy) || (this.newPlayerJoined == true)) {
					socket.volatile.emit("player", [x, y, sx, sy])
					this.newPlayerJoined = false // TODO: This should be handled by the server
				}
				this.timer = this.timer%this.interval
				this.oldx = x
				this.oldy = y
				this.oldsx = sx
				this.oldsy = sy
			}
		} else if (getState() == "minigame") { // Playing minigame
			// Send minigame data to server
			this.timer += dt
			if (this.timer > this.interval) {
				this.sendMinigameData(this.minigame.data)
			}
		}
	}

	addPlayer (id, player) {
		if ((id != socket.id) && (this.playerList[id] == null)) {
			this.playerList[id] = {
				name: player.profile.name
			}
			// TODO: move this code to world.js?
			CHARACTER[id] = new Character(PHYSICSWORLD, player.x, player.y, player.profile, WORLD.area)
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
		for (const [id, p] of Object.entries(playerList)) {
			console.log(id, p.profile.name)
			if ((id != socket.id) && (this.playerList[id] == null)) {
				this.addPlayer(id, p)
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
		if (CHARACTER[id] != null) {
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
		console.log("recieved area", area)
		if (CHARACTER[id] != null) {
			CHARACTER[id].area = area
		}
	}

	// Minigames
	// Tell server if client started playing minigame
	sendMinigame(minigame, minigameName) {
		this.minigame = minigame
		this.minigameName = minigameName
		this.minigamePlayerList = {}
		socket.timeout(this.timeOut).emitWithAck("minigame", minigameName, (err, val) => {
			console.log("could not connect to server :(")
		});
	}
	// Server will assign you a role in a minigame.
	// host: You are the first player to start this minigame. Everyone will see the same thing that's happening in your game. 
	// player: Other people are already playing this minigame. You will only see what the host is experiencing while you let them know what you are doing.
	// spectator: You are seeing what the host is seeing. You have no influence and have to send no data to them.
	recieveMinigameRole(role, minigamePlayerList) {
		console.log("Recieved minigame role:", role)
		this.minigamePlayerList = minigamePlayerList
		this.role = role
	}
	getMinigameRole() {
		return this.role
	}
	getMinigamePlayers() {
		return this.minigamePlayerList
	}
	addMinigamePlayer (id) {
		if ((id != socket.id) && (this.minigamePlayerList[id] == null)) {
			console.log("player joined minigame:", id)
			this.minigamePlayerList[id] = {}
			this.minigame.playerData[id] = {}
		}
	}
	removeMinigamePlayer (id) {
		if (id != socket.id) {
			delete this.minigamePlayerList[id]
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
		console.log("Recieved minigame data:", data)
		this.oldMinigameData = data
		this.minigame.playerData[id] = data
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