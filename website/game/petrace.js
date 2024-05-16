// Client Pet Race code

const PetRaceSystem = (function() {
	// Animations
	let animations = [0, 0,0,0,0]; // values 0-1

	const functions = {
		update(dt) {
			let data = NETPLAY.petRaceData
			if (data) {
				for (let i = 1; i < data.length; i++) {
					let [itemId, name, pos, speed, py, sy] = data[i]

					// Move pets
					data[i][2] += speed*dt // Horizontal movement
					data[i][4] += sy*dt // Vertical movement

					// Animations
					// Animation plays faster when pet is moving faster
					animations[i] = (animations[i] + dt*speed) % 1
				}
			}
		},

		draw() {
			let data = NETPLAY.petRaceData
			if (data) {
				for (let i = 1; i < data.length; i++) {
					let [itemId, name, pos, speed, py, sy] = data[i]

					let length = 800
					let posRange = 100

					// Draw pet in race line
					let x = (canvasWidth-length)/2 + (pos/posRange)*length
					let y = 140 + (i-1)*60

					if (!ITEMS.pet[itemId]) {
						console.log(`There is no pet with itemId ${itemId}`)
						continue
					}
					
					let img = ITEMS.pet[itemId].image
					let sprite = ITEMS.pet[itemId].sprite
					let animationFrame = 0
					if (speed !== 0) {
						animationFrame = 1 + Math.floor(animations[i]*2)
					}
					let stateFrame = 0

					// Draw pet
					DRAW.setColor(255,255,255,1.0)
					DRAW.image(IMG.shadow, null, x, y, 0, 1,1, 0.5,1.0)
					DRAW.setColor(0,0,0)
					DRAW.image(img, sprite.getFrame(animationFrame,stateFrame), x, y + py, 0, 1,1, 0.5,1.0)
					DRAW.setColor(255,255,255)
					// Name
					DRAW.setFont(FONT.nametag, 3)
					DRAW.text(name, x, Math.floor(y + py)+20, "center")
				}
			}
		}
	};
	
return functions; })()