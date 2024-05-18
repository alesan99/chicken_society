// Loading Screen

const LoadingScreen = (function() {
	// Loading
	let loading = false
	let endFunc = false
	let loadingList = []
	let loadingListLength = 0
	// Visuals
	let eggRotation = 0
	let eggSpeed = 0
	let eggTimer = 0.5
	// Fading
	let fade = 0
	
	const functions = {
		// Start loading screen
		start(func) {
			endFunc = func
			loadingListLength = loadingList.length
			loading = true
			fade = 0
		},

		end() {
			loadingList = []
			loadingListLength = 0
			loading = false
			endFunc() // callback
		},

		playing() {
			return loading
		},

		// Add asset to loading list
		wait(asset) {
			// Wait for asset (image, json, sound?) to finish loading
			loadingList.push(asset)
			loadingListLength = Math.max(loadingListLength, loadingList.length)
		},

		draw() {
			// Black background
			DRAW.setColor(0, 0, 0, 1.0)
			DRAW.rectangle(0, 0, canvasWidth, canvasHeight, "fill")

			// Rocking egg
			let rot = eggRotation*0.1
			DRAW.setColor(255,255,255,1.0)
			DRAW.image(IMG.loading, SPRITE.loading.getFrame(0,0), canvasWidth/2, canvasHeight/2+64, rot, 1,1, 0.5,1.0)
			DRAW.setColor(255,255,255,1.0)
			// Crack
			let frame = [...SPRITE.loading.getFrame(1,0)]; // copy cracking frame
			// Find top left of rotated egg
			let x = -frame[2]/2
			let y = -frame[3]
			let angle = Math.atan2(y, x)
			let dist = Math.sqrt(x*x + y*y)
			let newx = Math.cos(angle+rot)*dist
			let newy = Math.sin(angle+rot)*dist
			frame[2] = frame[2]*(1-(loadingList.length/loadingListLength)) // slowly show egg cracking
			DRAW.image(IMG.loading, frame, newx+canvasWidth/2, newy+canvasHeight/2+64, rot, 1,1, 0,0)

			// Black background
			if (fade < 1) {
				DRAW.setColor(0, 0, 0, 1.0-fade)
				DRAW.rectangle(0, 0, canvasWidth, canvasHeight, "fill")
			}
		},

		update(dt) {
			// Check if finished loading
			for (let i = 0; i < loadingList.length; i++) {
				if (loadingList[i].loaded) {
					loadingList.splice(i, 1)
				}
			}
			if (loadingList.length == 0) {
				this.end()
				return
			}

			// Shake Egg Animation
			eggTimer -= dt
			if (eggTimer < 0) {
				// Shake
				if (Math.random() < 0.5) {
					eggSpeed = 30
				} else {
					eggSpeed = -30
				}

				// Reset timer
				eggTimer = Math.random()*2+1.5
			}

			// Rock egg back and forth until it slowly stops
			let oldEggRotation = eggRotation
			if (eggRotation > 0) {
				eggSpeed -= 300*dt
			} else if (eggRotation < 0) {
				eggSpeed += 300*dt
			}
			eggRotation += eggSpeed*dt
			if (oldEggRotation > 0 && eggRotation < 0) {
				eggSpeed *= 0.7
				if (Math.abs(eggSpeed) < 10) {
					eggSpeed = 0
					eggRotation = 0
				}
			}

			// Fade in/out
			if (fade < 1) {
				fade = Math.min(1, fade + 12*dt)
			}
		},
	};
	
	return functions; })()