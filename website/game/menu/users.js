// Users menu; Displays all connected users

import {Menu, MENUS} from "../menu.js"
import {Button} from "../gui/gui.js"
import {RGBtoHEX, addNuggets} from "../savedata.js"
import {DRAW, SAVEDATA} from "../main.js"
import {IMG, SPRITE} from "../assets.js"

MENUS["usersMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

	load () {
		this.openTimer = 0

		this.buttons = {}
		this.buttons["close"] = new Button("✖", ()=>{closeMenu()}, null, 740,128, 32,32)

		// Actions
		this.buttons["visitCoop"] = new Button("Visit Coop", ()=>{
			let ownerId = NETPLAY.id
			if (this.listSelection > 0) {
				ownerId = this.list[this.listSelection]
			}
			if (ownerId == NETPLAY.id) {
				// Your coop
				WORLD.warpToArea("coop", null, null, ownerId, SAVEDATA.coop);
			} else {
				// Other player's coop (once you've recieved it from the server)
				NETPLAY.requestCoopData(ownerId, (data)=>{
					if (data) {
						WORLD.warpToArea("coop", null, null, ownerId, data);
					}
				})
			}
			closeMenu();
		}, null, this.x+this.w-170,this.y+this.h-100, 150,30)
		this.buttons["mute"] = new Button("Mute", ()=>{this.mutePlayer()}, null, this.x+this.w-170,this.y+this.h-60, 150,30)

		// User display list
		this.listX = this.x+20 // X position of list
		this.listY = this.y+50 // Y position of list
		this.listW = this.w-200-20 // Width of list
		this.listH = this.h-80 // Height of list
		this.listEntryH = 26 // Height of each entry
		this.listScroll = 0 // Scroll position of list
		this.listDisplayLen = Math.floor(this.listH/this.listEntryH) // Number of entries that can be displayed at once
		this.list = [] // What is currently being displayed in menu (Because some quests may be expanded, or sorted out)

		// Get list of connected player names
		this.connectedPlayers = []
		this.listSelection = 0
		this.generateConnectedPlayersList()

		this.buttons["scrollBar"] = new ScrollBar(this.listX+this.listW, this.listY, 20, this.listH, 0, 100, this.listH/this.listEntryH, (scroll)=>{this.updateScroll(scroll)}, 1)
		this.buttons["scrollBar"].updateRange(0, this.list.length, null)
	}

	generateConnectedPlayersList() {
		let selectedID = "PLAYER"
		if (this.list.length > 0) {
			selectedID = this.list[this.listSelection]
		}

		this.connectedPlayers = []
		if (NETPLAY.playerList) {
			for (const [id, data] of Object.entries(NETPLAY.playerList)) {
				this.connectedPlayers.push(id)
			}
			this.connectedPlayers.sort()
		}
		this.connectedPlayers.unshift("PLAYER") // Make the player the first entry in list
		this.list = this.connectedPlayers

		// Now that list has changed, make sure the selection is still the same.
		for (let i=0; i<this.list.length; i++) {
			let entry = this.list[i]
			if (entry == selectedID) {
				this.listSelection = i
				break
			}
		}
		this.selectPlayer(Math.min(this.list.length, this.listSelection))
	}

	keyPress(key) {
	}

	keyRelease(key) {
	}

	mouseClick(button, x, y) {
		// Select an entry from the list
		if (x > this.listX && x < this.listX+this.listW && y > this.listY && y < this.listY+this.listH) {
			let i = Math.floor((y-this.listY+this.listScroll*this.listEntryH)/this.listEntryH)
			if (i >= 0 && i < this.list.length) {
				this.selectPlayer(i)
			}
		}
		super.mouseClick(button, x, y)
		if (!MENUS["chatMenu"].checkMouseInside()) {
			// Disable clicking anywhere else, except for chat hud
			return true
		}
	}

	mouseRelease(button, x, y) {
		return super.mouseRelease(button, x, y)
	}

	updateScroll(scroll) {
		this.listScroll = scroll
	}
	
	draw() {
		// Window
		let scale = 1
		if (this.openTimer < 1) {
			scale = easing("easeOutBack", this.openTimer)
		}
		DRAW.image(IMG.menu, null, this.x+this.w*0.5, this.y+this.h*0.5, 0, scale, scale, 0.5, 0.5)

		DRAW.setColor(255,255,255, scale)
		DRAW.rectangle(this.listX, this.listY, this.listW, this.listH, 1.0, 0, 0, 0, 0.5)
		
		// Draw list
		let displayStart = Math.floor(this.listScroll)
		let displayEnd = Math.min(this.list.length, Math.ceil(this.listScroll+this.listDisplayLen))
		for (let i=displayStart; i<displayEnd; i++) {
			let y = this.listY + i*this.listEntryH - this.listScroll*this.listEntryH
			let playerID = this.list[i]
			let name = ""
			if (playerID == "PLAYER") {
				name = `${PLAYER.name} (You)`
			} else {
				let playerData = NETPLAY.getPlayerData(playerID)
				if (playerData) {
					name = playerData.name
				} else {
					name = "[player left]"
				}
			}

			// Selection?
			if (this.listSelection == i) {
				DRAW.setColor(220,220,240, scale)
				DRAW.rectangle(this.listX, y, this.listW, this.listEntryH, "fill")
			}
			
			// Seperator line
			DRAW.setColor(220,220,230, scale)
			DRAW.setLineWidth(2)
			DRAW.line(this.listX, y+this.listEntryH, this.listX+this.listW, y+this.listEntryH)

			// Name
			DRAW.setFont(FONT.caption)
			DRAW.setColor(0,0,0, scale)
			DRAW.text(name, this.listX+10, y+this.listEntryH-4, "left")
		}
		DRAW.setColor(244, 188, 105, 1.0) // Cover up scrolling past list window
		//DRAW.rectangle(this.listX, this.listY-this.listEntryH, this.listW, this.listEntryH, "fill") // Cover top
		//DRAW.rectangle(this.listX, this.listY+this.listH, this.listW, this.listEntryH, "fill") // Cover bottom
		DRAW.image(IMG.menu, [20,24, this.listW,this.listEntryH], this.listX, this.listY-this.listEntryH) // Cover top
		DRAW.image(IMG.menu, [20,320, this.listW,this.listEntryH], this.listX, this.listY+this.listH) // Cover bottom

		// Text
		DRAW.setColor(112, 50, 16, scale)
		DRAW.setFont(FONT.caption)
		DRAW.text("Connected Players", this.x+20, this.y+35, "left")

		// Indent shadow
		DRAW.setColor(80,80,120, scale*0.3)
		DRAW.setLineWidth(4)
		DRAW.line(this.listX+2,this.listY+this.listH, this.listX+2,this.listY+2, this.listX+this.listW,this.listY+2)

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
	}

	selectPlayer(i) {
		this.listSelection = i
		let id = this.list[this.listSelection]
		// Disable mute button for player
		if (id == "PLAYER") {
			this.buttons["mute"].disabled = true
		} else {
			this.buttons["mute"].disabled = false
		}
		// Change text on mute button
		if (NETPLAY.mutedPlayers && NETPLAY.mutedPlayers[id]) {
			this.buttons["mute"].label = "Unmute"
		} else {
			this.buttons["mute"].label = "Mute"
		}
	}

	// Mute selected player
	mutePlayer() {
		let id = this.list[this.listSelection]

		let doMute = true
		if (NETPLAY.mutedPlayers && NETPLAY.mutedPlayers[id]) { // Toggle
			doMute = false
		}
		if (NETPLAY.mutePlayer(id, doMute)) {
			// Change text on mute button
			if (doMute) {
				this.buttons["mute"].label = "Unmute"
			} else {
				this.buttons["mute"].label = "Mute"
			}
		}
	}
}()