// WORMDLE
// Like Wordle, but with Snake gameplay

import { MINIGAMES } from "../minigame.js"
import { DRAW, SAVEDATA } from "../../main.js"
import Notify from "../../gui/notification.js"
import { conditionsUpdate } from "../../area.js"
import { IMG, SPRITE, ANIM, FONT, SFX, loadJSON5, loadJSON, ITEMS } from "../../assets.js"
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../../savedata.js"
import { MENUS } from "../../menu.js"
import { OBJECTS, PLAYER, PLAYER_CONTROLLER, PHYSICSWORLD, DEBUGPHYSICS, MINIGAME } from "../../world.js"
import { NETPLAY } from "../../main.js"
import { canvasWidth, canvasHeight, RenderImage } from "../../engine/render.js"
import { Sprite, Animation } from "../../engine/sprite.js"
import Shape from "../../shape.js"
import AudioSystem from "../../engine/audio.js"
import { SpatialHash, updatePhysics, drawPhysics } from "../../physics.js"
import {PhysicsObject} from "../../objects/objects.js"

if (true) {
let Grid;
let Worm;
let awarded = false;

MINIGAMES["wormdle"] = new class {
	constructor() {
		
	}

	load() {
		this.timer = 0

		// Load Assets
		this.img = {}
		this.sprite = {}
		this.img.arcadeCabinet = new RenderImage("game/minigames/wormdle/arcade_cabinet.png")

		this.loaded = false
		loadJSON("game/minigames/wormdle/5-letter-words.json", (data)=>{
			this.loaded = true;
			this.words = data;
		})

		// Grid
		this.gridX = 200
		this.gridY = 50
		this.gridW = 13
		this.gridH = 8
		this.gridSize = 48
		
		this.grid = new Grid(this.gridW, this.gridH, this.gridSize)

		this.started = false
		this.won = false
	}

	randomSeed(seed) {
		// make string into a usable int
		let num = 0
		for (let i = 0; i < seed.length; i++) {
			num += seed.charCodeAt(i)*Math.pow(10, i)
		}
		this.seed = num
	}

	random() {
		// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
		var x = Math.sin(this.seed++) * 10000;
		return x - Math.floor(x);
	}

	start() {
		// Wordle
		// use the date (without time) as a seed
		let date = new Date()
		date.setHours(0,0,0,0)
		this.randomSeed(date.toISOString())
		this.word = this.words[Math.floor(this.random()*this.words.length)]
		// reset seed to something random
		
		this.grid = new Grid(this.gridW, this.gridH, this.gridSize)

		// Worm
		this.worm = new Worm(Math.floor(this.gridW/2), Math.floor(this.gridH/2), this.grid, this)

		// Set up grid
		this.addLetters()

		this.started = true
		this.won = false
	}

	win() {
		// Win when word is guessed
		if (this.won) {
			return
		}
		this.won = true
		this.started = false

		// Give reward
		// 5 nuggets are subtracted for every incorrect guess
		if (!awarded) {
			let nuggets = 30
			nuggets = Math.max(0, nuggets - 5*(Math.floor(this.worm.letters.length/this.word.length)-1))
			addNuggets(nuggets)
		}
		awarded = true
	}

	update(dt) {
		// Called every frame
		this.timer += this.speed*dt
		this.speed = Math.max(1, this.speed - 2*dt)

		if (!this.started) {
			return
		}

		// Update worm
		this.worm.update(dt)

		// Died
		if (this.worm.died) {
			this.started = false;
			return
		}
	}
  
	draw() {
		// Background
		DRAW.setColor(34,31,37,1.0)
		DRAW.rectangle(0,0,canvasWidth,canvasHeight, "fill")

		// Grid
		// Draw cells
		DRAW.setColor(0,0,0,1.0)
		DRAW.setFont(FONT.big)
		for (let x = 0; x < this.gridW; x++) {
			for (let y = 0; y < this.gridH; y++) {
				let cell = this.grid.getCell(x, y)
				if (typeof cell == "string") {
					let letter = cell
					DRAW.setColor(255,255,255,1.0)
					DRAW.rectangle(this.gridX+x*this.gridSize, this.gridY+y*this.gridSize, this.gridSize, this.gridSize, "fill")
					DRAW.setColor(0,0,0,1.0)
					// make letter uppercase
					letter = letter.toUpperCase()
					DRAW.text(letter, this.gridX+x*this.gridSize+this.gridSize/2, this.gridY+y*this.gridSize+this.gridSize/2+15, "center")
				}
			}
		}
		// Draw worm
		if (this.worm) {
			for (let i = 0; i < this.worm.segs.length; i++) {
				let seg = this.worm.segs[i]
				let letter = this.worm.letters[i]
				DRAW.setColor(76,75,78,1.0)
				DRAW.rectangle(this.gridX+seg[0]*this.gridSize, this.gridY+seg[1]*this.gridSize, this.gridSize, this.gridSize, "fill")
				if (i == this.worm.segs.length-1) {
					// Show movement
					DRAW.setColor(96,95,98,1.0)
					if (this.worm.dir == "right") {
						DRAW.rectangle(this.gridX+seg[0]*this.gridSize, this.gridY+seg[1]*this.gridSize, this.gridSize*(this.worm.moveTimer/this.worm.moveTime), this.gridSize, "fill")
					} else if (this.worm.dir == "left") {
						DRAW.rectangle(this.gridX+seg[0]*this.gridSize+(1-this.worm.moveTimer/this.worm.moveTime)*this.gridSize, this.gridY+seg[1]*this.gridSize, this.gridSize*(this.worm.moveTimer/this.worm.moveTime), this.gridSize, "fill")
					} else if (this.worm.dir == "down") {
						DRAW.rectangle(this.gridX+seg[0]*this.gridSize, this.gridY+seg[1]*this.gridSize, this.gridSize, this.gridSize*(this.worm.moveTimer/this.worm.moveTime), "fill")
					} else if (this.worm.dir == "up") {
						DRAW.rectangle(this.gridX+seg[0]*this.gridSize, this.gridY+seg[1]*this.gridSize+(1-this.worm.moveTimer/this.worm.moveTime)*this.gridSize, this.gridSize, this.gridSize*(this.worm.moveTimer/this.worm.moveTime), "fill")
					}
				}
				if (letter) {
					let li = Math.floor(i/this.word.length)*this.word.length + i%this.word.length
					let correct = this.getLetterCorrect(letter, i%this.word.length)
					if (correct === 1) {
						DRAW.setColor(255,174,89,1.0)
					} else if (correct == 2) {
						DRAW.setColor(31,183,71,1.0)
					} else {
						DRAW.setColor(76,75,78,1.0)
					}
					DRAW.rectangle(this.gridX+seg[0]*this.gridSize, this.gridY+seg[1]*this.gridSize, this.gridSize, this.gridSize, "fill")
					DRAW.setColor(255,255,255,1.0)
					// make letter uppercase
					letter = letter.toUpperCase()
					DRAW.text(letter, this.gridX+seg[0]*this.gridSize+this.gridSize/2, this.gridY+seg[1]*this.gridSize+this.gridSize/2+15, "center")
				}
			}
		}
		// Grid lines
		DRAW.setColor(0,0,0,1.0)
		DRAW.setLineWidth(2)
		for (let x = 0; x <= this.gridW; x++) {
			DRAW.line(this.gridX+x*this.gridSize, this.gridY, this.gridX+x*this.gridSize, this.gridY+this.gridH*this.gridSize)
		}
		for (let y = 0; y <= this.gridH; y++) {
			DRAW.line(this.gridX, this.gridY+y*this.gridSize, this.gridX+this.gridW*this.gridSize, this.gridY+y*this.gridSize)
		}

		// Word
		if (this.worm) {
			let wormWordStart = (Math.ceil(this.worm.letters.length/this.word.length)-1)*this.word.length
			for (let i = 0; i < this.word.length; i++) {
				let letter = this.worm.letters[i+wormWordStart]
				let scale = 1.0
				if (letter) {
					let correct = this.getLetterCorrect(letter, i)
					if (correct === 1) { // close
						DRAW.setColor(255,174,89,1.0)
					} else if (correct == 2) { // correct
						DRAW.setColor(31,183,71,1.0)
					} else { // incorrect
						DRAW.setColor(76,75,78,1.0)
					}
					if (!this.worm.letters[i+wormWordStart+1]) { // animation
						if (this.worm.eating && this.worm.eatingTimer > 0) {
							scale = 1.0 - (this.worm.eatingTimer/this.worm.eatingTime)**2
						}
					}
					DRAW.rectangle((340 + 68*i+32)-(32*scale), (444+32)-(32*scale), 64*scale, 64*scale, "fill")
					DRAW.setColor(255,255,255,1.0)
					// make letter uppercase
					letter = letter.toUpperCase()
					DRAW.text(letter, 372 + 68*i, 492, "center")
				}
				DRAW.setColor(0,0,0,1.0)
				DRAW.rectangle(340 + 68*i, 444, 64, 64, "line")
			}
		}

		// Dead
		if (this.worm && this.worm.died) {
			DRAW.setColor(0,0,0,0.5)
			DRAW.rectangle(0,0,canvasWidth,canvasHeight, "fill")
			DRAW.setColor(255,255,255,1.0)
			DRAW.setFont(FONT.big)
			DRAW.text("You Died LOL", canvasWidth/2, canvasHeight/2, "center")
		} else if (this.won) {
			DRAW.setColor(0,0,0,0.5)
			DRAW.rectangle(0,0,canvasWidth,canvasHeight, "fill")
			DRAW.setColor(255,255,255,1.0)
			DRAW.setFont(FONT.big)
			DRAW.text("You Won!", canvasWidth/2, canvasHeight/2, "center")
		} else if (!this.started) {
			DRAW.setColor(255,255,255,1.0)
			DRAW.setFont(FONT.big)
			DRAW.text("Press any key to start", canvasWidth/2, canvasHeight/2, "center")
			DRAW.text("WORMDLE", canvasWidth/2, 490, "center")
		}

		// Arcade Cabinet
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(this.img.arcadeCabinet, null, 0, 0)
	}

	addLetters() {
		// Erase all letters
		for (let x = 0; x < this.gridW; x++) {
			for (let y = 0; y < this.gridH; y++) {
				let cell = this.grid.getCell(x, y)
				if (typeof cell == "string") {
					this.grid.setCell(x, y, false)
				}
			}
		}

		// Add letters to grid
		let alphabet = "abcdefghijklmnopqrstuvwxyz"
		let count = 8
		let letters = []
		let stage = this.worm.letter

		// Add correct letter
		letters.push(this.word[stage])
		// remove letter from alphabet
		let letteri = alphabet.indexOf(this.word[stage])
		alphabet = alphabet.slice(0, letteri) + alphabet.slice(letteri+1)

		// Add random letters
		for (let i = 0; i < count-1; i++) {
			let random = Math.floor(Math.random()*alphabet.length)
			letters.push(alphabet[random])
			// remove letter from alphabet
			alphabet = alphabet.slice(0, random) + alphabet.slice(random+1)
		}

		// Place letters on grid
		let places = []
		for (let x = 0; x < this.gridW; x++) {
			for (let y = 0; y < this.gridH; y++) {
				let pass = false
				// space must be empty
				if (this.grid.getCell(x, y) === false) {
					pass = true
				}
				// space cannot be in front of snake
				if (this.worm.dir == "down" && y == this.worm.y-1 && x == this.worm.x) {
					pass = false
				} else if (this.worm.dir == "up" && y == this.worm.y+1 && x == this.worm.x) {
					pass = false
				} else if (this.worm.dir == "left" && x == this.worm.x+1 && y == this.worm.y) {
					pass = false
				} else if (this.worm.dir == "right" && x == this.worm.x-1 && y == this.worm.y) {
					pass = false
				}
				if (pass) {
					places.push([x,y])
				}
			}
		}
		for (let i = 0; i < letters.length; i++) {
			let [x,y] = places.splice(Math.floor(Math.random()*places.length), 1)[0]
			this.grid.setCell(x, y, letters[i])
		}
	}

	getLetterCorrect(letter, i) {
		// Returns if letter is in word
		// 0 = incorrect, 1 = correct letter, 2 = correct position
		let correct = 0
		if (this.word[i] == letter) {
			correct = 2
		} else if (this.word.includes(letter)) {
			correct = 1
		}
		return correct
	}

	keyPress(key) {
		// Change direction
		if (this.started) {
			if (key == "ArrowDown") {
				this.worm.turn("down")
			} else if (key == "ArrowUp") {
				this.worm.turn("up")
			} else if (key == "ArrowLeft") {
				this.worm.turn("left")
			} else if (key == "ArrowRight") {
				this.worm.turn("right")
			}
		}

		// Press any button to start
		if (!this.started && this.loaded) {
			this.start()
		}
	}

	keyRelease(key) {
		
	}

	mouseClick(button, x, y) {
		// Change direction
		if (this.started) {
			let [gridX, gridY] = [(x-this.gridX)/this.gridSize, (y-this.gridY)/this.gridSize]
			if (Math.abs(gridX - this.worm.x) > Math.abs(gridY - this.worm.y)) {
				if (gridX > this.worm.x) {
					this.worm.turn("right")
				} else if (gridX < this.worm.x) {
					this.worm.turn("left")
				}
			} else {
				if (gridY > this.worm.y) {
					this.worm.turn("down")
				} else if (gridY < this.worm.y) {
					this.worm.turn("up")
				}
			}
		}

		// Press any button to start
		if (!this.started && this.loaded) {
			this.start()
		}
	}
}()

// Grid
Grid = class {
	constructor(w, h, size) {
		this.grid = []
		this.w = w
		this.h = h
		for (let x = 0; x < this.w; x++) {
			this.grid[x] = []
			for (let y = 0; y < this.h; y++) {
				this.grid[x][y] = false;
			}
		}
	}

	getCell(x, y) {
		// false = empty, true = solid, string = letter
		if (x < 0 || x >= this.w || y < 0 || y >= this.h) {
			return true; // Solid
		}
		return this.grid[x][y]
	}

	setCell(x, y, v) {
		this.grid[x][y] = v
	}
}

// Worm
Worm = class {
	constructor(x, y, grid, game) {
		this.x = x
		this.y = y

		this.grid = grid
		this.game = game

		// Segments
		this.segs = []
		this.letters = []
		this.letter = 0

		this.addSegment("First", x, y)

		// Move
		this.moveTimer = 0
		this.moveTime = 0.3

		this.dir = "down"

		// Pause after eating letters
		this.eating = false
		this.eatingTimer = 0
		this.eatingTime = 0.4
	}
	update(dt) {
		// Eating
		if (this.eating) {
			this.eatingTimer -= dt
			if (this.eatingTimer <= 0) {
				this.eating = false
			}
			return
		}

		// Moving
		this.moveTimer += dt
		if (this.moveTimer >= this.moveTime) {
			this.moveTimer -= this.moveTime
			
			let [nx, ny] = [this.x, this.y]
			if (this.dir == "down") {
				[nx, ny] = [this.x, this.y+1]
			} else if (this.dir == "up") {
				[nx, ny] = [this.x, this.y-1]
			} else if (this.dir == "left") {
				[nx, ny] = [this.x-1, this.y]
			} else if (this.dir == "right") {
				[nx, ny] = [this.x+1, this.y]
			}

			let cell = this.grid.getCell(nx, ny)
			if (cell === true) {
				// Hit solid
				this.died = true
				return
			} else if (cell === false) {
				// Move
				this.move(nx,ny)
			} else {
				// Eat letter
				this.addSegment(cell, nx, ny)
				this.game.addLetters()

				this.eating = true
				this.eatingTimer = this.eatingTime
			}
		}
	}
	turn(dir) {
		// Change direction of movement
		let pass = true
		// Check if not turning back onto previous segment
		let prevSeg = this.segs[this.segs.length-2]
		if (prevSeg) {
			let [px, py] = prevSeg
			if (dir == "down" && py == this.y+1) {
				pass = false
			} else if (dir == "up" && py == this.y-1) {
				pass = false
			} else if (dir == "left" && px == this.x-1) {
				pass = false
			} else if (dir == "right" && px == this.x+1) {
				pass = false
			}
		}
		// Turn if pass
		if (pass) {
			this.dir = dir
		}
	}
	move(nx, ny) {
		// Pop last segment
		let [rx, ry] = this.segs.shift()
		this.grid.setCell(rx, ry, false)
		// Create new segment at head
		this.segs.push([nx, ny])
		this.grid.setCell(nx, ny, true)

		this.x = nx
		this.y = ny
	}
	addSegment(letter, nx, ny) {
		// Add segment to the front
		this.segs.push([nx, ny])
		this.grid.setCell(nx, ny, true)

		if (this.segs.length > 1) {
			this.letters.push(letter)
			this.letter = (this.letter + 1)%this.game.word.length
		}
		this.x = nx
		this.y = ny

		// Check if guessed word
		let wormWordStart = (Math.floor(this.letters.length/this.game.word.length)-1)*this.game.word.length
		let correct = true
		for (let i = 0; i < this.game.word.length; i++) {
			if (this.game.word[i] != this.letters[i+wormWordStart]) {
				correct = false
			}
		}
		if (correct) {
			this.game.win()
		}
	}
}
}