var socket = io(); // No URL because it defaults to trying to connect to host that serves page

class Netplay {
	constructor () {
        this.timer = 0
        this.interval = 1/15 //Time inbetween sending data to server

        // Client
        this.connect()
        // this.id = socket.id //TODO: Do something else? Ideally client should not know its server-side id.

        // Events
        socket.on("playerList", (playerList) => {this.getPlayerList(playerList)})
        socket.on("addPlayer", (id, player) => {this.addPlayer(id, player)})
        socket.on("removePlayer", (id) => {this.removePlayer(id)})
        socket.on("player", (id, position) => {this.recievePosition(id, position)})
	}

    connect () {
        socket.timeout(10000).emitWithAck("profile", PROFILE, (err, val) => {
            console.log("could not connect to server :(")
        });
    }

	update (dt) {
        // Send position to server
        this.timer += dt
        if (this.timer > this.interval) {
            socket.volatile.emit("player", [PLAYER.x, PLAYER.y]);
            this.timer = this.timer%this.interval
        }
    }

    // TODO: move this code to world.js
    addPlayer (id, player) {
        if ((id != socket.id) && (CHARACTER[id] == null)) {
            CHARACTER[id] = new Character(player.x, player.y, 120, 160, player.profile.name)
        }
    }

    removePlayer (id) {
        if (id != socket.id) {
            delete CHARACTER[id]
        }
    }

    getPlayerList (playerList) {
        console.log("recieved playerList")
		for (const [id, p] of Object.entries(playerList)) {
            console.log(id, p.profile.name)
            if ((id != socket.id) && (CHARACTER[id] == null)) {
			    this.addPlayer(id, p)
            }
		}
    }

    recievePosition (id, position) {
        console.log("recieved player data", id)
        if (CHARACTER[id]) {
            CHARACTER[id].x = position[0]
            CHARACTER[id].y = position[1]
        }
    }
}

