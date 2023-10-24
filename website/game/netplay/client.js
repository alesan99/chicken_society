var socket = io(); // No URL because it defaults to trying to connect to host that serves page

class Netplay {
	constructor () {
		this.timer = 0
		this.interval = 5/60 //Time inbetween sending data to server

		// Client
		this.connect()

		// Player syncing information
		this.oldx = 0
		this.oldy = 0
		this.oldsx = 0
		this.oldsy = 0
		this.newPlayerJoined = false

		// Events
		socket.on("playerList", (playerList) => {this.getPlayerList(playerList)})
		socket.on("addPlayer", (id, player) => {this.addPlayer(id, player)})
		socket.on("removePlayer", (id) => {this.removePlayer(id)})
		socket.on("player", (id, position) => {this.recievePosition(id, position)})
		socket.on("chat", (id, text) => {this.recieveChat(id, text)})
		socket.on("updateProfile",(id, profile) => {this.recieveProfile(id, profile)})
		socket.on("emote", (id, emote) => {this.recieveEmote(id, emote)})
		socket.on("area", (id, area) => {this.recieveArea(id, area)})
	}

	// Connect to server for the first time and send information about yourself
	connect () {
		socket.timeout(10000).emitWithAck("profile", PROFILE, (err, val) => {
			console.log("could not connect to server :(")
		});
	}

	update (dt) {
		// Send position to server
		this.timer += dt
		if (this.timer > this.interval) {
			// Calculate velocity of player
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
	}

	// TODO: move this code to world.js
	addPlayer (id, player) {
		if ((id != socket.id) && (CHARACTER[id] == null)) {
			CHARACTER[id] = new Character(PHYSICSWORLD, player.x, player.y, player.profile, WORLD.area)
			this.newPlayerJoined = true
		}
	}

	removePlayer (id) {
		if (id != socket.id) {
			CHARACTER[id].destroy()
			delete CHARACTER[id]
		}
	}

	// Recieve list of players
	getPlayerList (playerList) {
		console.log("recieved playerList")
		for (const [id, p] of Object.entries(playerList)) {
			console.log(id, p.profile.name)
			if ((id != socket.id) && (CHARACTER[id] == null)) {
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
}

