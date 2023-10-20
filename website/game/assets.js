//Load images, audio, and other data

BACKGROUND = []
IMG = []
SPRITE = []
ANIM = []
FONT = []

function loadGameAssets() {
	// World objects
	IMG.chicken = new RenderImage("assets/chicken.png")
	IMG.chicken.makeColorable()
	SPRITE.chicken = new Sprite(IMG.chicken, 8, 6, 0, 0, 128, 128, 129, 129)
	ANIM.stand = [[0]]
	ANIM.walk = [[1, 2], 0.2]
	ANIM.dance = [[1, 2, 3], 0.2]
	ANIM.sit = [[3], 99999]
	ANIM.wave = [[4,5,4,5,4,5], 0.2]

	IMG.chatBubble = new RenderImage("assets/chat_bubble.png")

	// Chicken Customization
	HATOFFSET = [
		[[64,1],[64,1],[66,2] ,[66,9],[64,2],[64,2],[64,1],[64,1]],
		[[89,3],[89,3],[86,10],[66,9],[64,2],[64,2],[64,1],[64,1]],
		[[63,2],[63,2],[66,2] ,[66,9],[64,2],[64,2],[64,1],[64,1]]
	]
	ACCESSORYOFFSET = [
		[[64,55],[64,55],[66,56],[66,63],[64,55],[64,55],[64,1],[64,1]],
		[[89,49],[89,49],[86,52],[66,63],[64,55],[64,55],[64,1],[64,1]],
		[[63,56],[63,56],[66,57],[66,63],[64,55],[64,55],[64,1],[64,1]]
	]
	IMG.hat = {}
	SPRITE.hat = {}
	IMG.hat["tophat"] = true
	for (const [name, value] of Object.entries(IMG.hat)) {
		IMG.hat[name] = new RenderImage(`assets/hats/${name}.png`)
		IMG.hat[name].center = [[0.5, 0.7],[0.5, 0.7],[0.5, 0.7]]
		fetch(`assets/hats/${name}.json`).then(response => {
			if (!response.ok) {
				console.log("JSON Network response was not ok")
			}
			return response.json()
		})
		.then(data => {
			IMG.hat[name].center = data.center
		})
		.catch(error => {
			console.log("There was a problem loading the JSON file:", error)
		})
		SPRITE.hat[name] = new Sprite(IMG.hat[name], 1, 3, 0, 0, 74, 67, 74, 68)
	}
	IMG.accessory = {}
	SPRITE.accessory = {}
	IMG.accessory["scarf"] = true
	IMG.accessory["chains"] = true
	for (const [name, value] of Object.entries(IMG.accessory)) {
		IMG.accessory[name] = new RenderImage(`assets/accessories/${name}.png`)
		IMG.accessory[name].center = [[0.5, 0],[0.5, 0],[0.5, 0]]
		fetch(`assets/accessories/${name}.json`).then(response => {
			if (!response.ok) {
				console.log("JSON Network response was not ok")
			}
			return response.json()
		})
		.then(data => {
			IMG.accessory[name].center = data.center
		})
		.catch(error => {
			console.log("There was a problem loading the JSON file:", error)
		})
		SPRITE.accessory[name] = new Sprite(IMG.accessory[name], 1, 3, 0, 0, 128, 128, 128, 129)
	}

	// Area graphics
	BACKGROUND.hub = new RenderImage("assets/areas/hub.png")

	FONT.caption = new RenderFont("Arial", 20)
	FONT.chatBubble = new RenderFont("Courier New", 18)
}