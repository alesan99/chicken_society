MINIGAMES["slots"] = new class {
	constructor() {
		
	}

	load() {
		this.timer = 0
		this.speed = 1
	}

	update(dt) {
		this.timer += this.speed*dt
		this.speed = Math.max(1, this.speed - 2*dt)
	}
  
	draw() {
		// Test
		DRAW.clear(0,100,255)
		DRAW.setColor(0,100,255,1.0)
		DRAW.rectangle(0,0,canvasWidth,canvasHeight)
		DRAW.setFont(FONT.big)
		let num = Math.ceil(this.speed)
		for (let i = 0; i < num; i++) {
			let a = 1.0
			if (num != 1) {
				a = 1.0-(i/(num-1))
			}
			DRAW.setColor(255,0,0,a)
			DRAW.text("Hello World", canvasWidth/2, canvasHeight/2-10+Math.sin(this.timer-(i/100))*20, "center")
		}
	}

	keyPress(key) {
		this.speed += 1
	}

	keyRelease(key) {
		
	}

	mouseClick(button, x, y) {

	}
}()