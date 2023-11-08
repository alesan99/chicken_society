//Load images, audio, and other data

IMG = []
SPRITE = []
ANIM = []
FONT = []
BACKGROUND = []
BACKGROUNDIMG = []
BACKGROUNDSPRITE = []
BACKGROUNDANIM = []

function loadGameAssets() {
	// World objects
	// Chicken
	IMG.chicken = new RenderImage("assets/chicken.png")
	IMG.chicken.makeColorable()
	SPRITE.chicken = new Sprite(IMG.chicken, 8, 6, 0, 0, 128, 128, 129, 129)
	ANIM.stand = [[0]] // Animations format. [[Frame 1, Frame 2...], [Delay 1, Delay 2...]]
	ANIM.walk = [[1, 2], 0.2]
	ANIM.dance = [[1, 2, 5, 4, 6, 7, 6, 7], 0.3]
	ANIM.sit = [[3], 99999]
	ANIM.wave = [[4,5,4,5,4,5], 0.2]

	IMG.shadow = new RenderImage("assets/shadow.png")
	IMG.chatBubble = new RenderImage("assets/chat_bubble.png")

	// Chicken Customization
	// TODO: Clean up this horrible code
	HATOFFSET = [ // Center of chicken head where hat should be placed
		[[64,1],[64,1],[66,2] ,[66,9],[64,2],[64,2],[4,62],[64,1]],
		[[89,3],[89,3],[86,10],[66,9],[64,2],[64,2],[4,62],[64,1]],
		[[63,2],[63,2],[66,2] ,[66,9],[64,2],[64,2],[4,62],[64,1]]
	]
	ACCESSORYOFFSET = [ // Center of chicken chin where accessory should be placed
		[[64,55],[64,55],[66,56],[66,63],[64,55],[64,55],[59,62],[64,55]],
		[[89,49],[89,49],[86,52],[66,63],[64,55],[64,55],[59,62],[64,55]],
		[[63,56],[63,56],[66,57],[66,63],[64,55],[64,55],[59,62],[64,55]]
	]
	CHICKENROTATION = [ // Rotation of chicken hat & accessory for each frame
		0,0,0,0,0,0,-Math.PI*0.5,0
	]
	// List of all hats to load
	IMG.hat = {}
	SPRITE.hat = {}
	IMG.hat["tophat"] = true

	for (const [name, value] of Object.entries(IMG.hat)) {
		// Load image, create sprite frames when image is loaded, and load hat centers from JSON
		let async = function() {
			SPRITE.hat[name] = new Sprite(IMG.hat[name], 1, 3, 0, 0, IMG.hat[name].w, (IMG.hat[name].h-2)/3, IMG.hat[name].w, (IMG.hat[name].h-2)/3+1)
		}
		IMG.hat[name] = new RenderImage(`assets/hats/${name}.png`, async)
		IMG.hat[name].center = [[0.5, 0.7],[0.5, 0.7],[0.5, 0.7]]
		loadJSON(`assets/hats/${name}.json`, (data) => {
			IMG.hat[name].center = data.center
		})
	}
	// List of all accessories to load
	IMG.accessory = {}
	SPRITE.accessory = {}
	IMG.accessory["scarf"] = true
	IMG.accessory["chains"] = true
	IMG.accessory["beefcakeaccessories"] = true

	for (const [name, value] of Object.entries(IMG.accessory)) {
		// Load image, create sprite frames when image is loaded, and load accessory centers from JSON
		let async = function() {
			SPRITE.accessory[name] = new Sprite(IMG.accessory[name], 1, 3, 0, 0, IMG.accessory[name].w, (IMG.accessory[name].h-2)/3, IMG.accessory[name].w, (IMG.accessory[name].h-2)/3+1)
		}
		IMG.accessory[name] = new RenderImage(`assets/accessories/${name}.png`, async)
		IMG.accessory[name].center = [[0.5, 0],[0.5, 0],[0.5, 0]]
		loadJSON(`assets/accessories/${name}.json`, (data) => {
			IMG.accessory[name].center = data.center
			console.log(IMG.accessory[name].center)
		})
	}

	FONT.caption = new RenderFont("Arial", 20)
	FONT.chatBubble = new RenderFont("Courier New", 18)
	FONT.guiLabel = new RenderFont("Times New Roman", 30)
}

// Load array with JSON data; filePath, callBack function called after file is finished loading
function loadJSON(filePath, callBack) {
	// JSON file must be loaded asynchronously
	fetch(filePath).then(response => {
		if (!response.ok) {
			console.log("JSON Network response was not ok")
		}
		return response.json()
	})
	.then(data => {
		callBack(data)
	})
	.catch(error => {
		console.log("There was a problem loading the JSON file:", error)
	})
}

