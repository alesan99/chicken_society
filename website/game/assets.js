//Load images, audio, and other data

IMG = []
SPRITE = []
ANIM = []
FONT = []

BACKGROUND = []
BACKGROUNDIMG = []
BACKGROUNDSPRITE = []
BACKGROUNDANIM = []

DIRECTORYTREE = {}

function loadGameAssets() {
	// World objects
	// Chicken
	IMG.chicken = new RenderImage("assets/chicken.png")
	IMG.chicken.makeColorable()
	SPRITE.chicken = new Sprite(IMG.chicken, 8, 6, 128,128, 0,0, 1,1)
	ANIM.stand = [[0]] // Animations format. [[Frame 1, Frame 2...], [Delay 1, Delay 2...]]
	ANIM.walk = [[1, 2], 0.2]
	ANIM.dance = [[1, 2, 5, 4, 6, 7, 6, 7], 0.3]
	ANIM.sit = [[3], 99999]
	ANIM.wave = [[4,5,4,5,4,5], 0.2]
	ANIM.tbag = [[0,3,0,3,0,3,0,3,0,3], 0.15]

	IMG.shadow = new RenderImage("assets/shadow.png")
	IMG.speechBubble = new RenderImage("assets/chat_bubble.png")
	IMG.replyBubble = new RenderImage("assets/reply_bubble.png")
	SPRITE.replyBubble = new Sprite(IMG.replyBubble, 2,1, 64,32)
	SPRITE.replyTrail = new Sprite(IMG.replyBubble, 2,1, 64,32, 0,32)
	IMG.dialogue = new RenderImage("assets/dialogue.png")
	IMG.action = new RenderImage("assets/action.png")
	SPRITE.action = new Sprite(IMG.action, 1,3, 120,50)

	// CHAT MENU & HUD
	IMG.nugget = new RenderImage("assets/nugget.png")
	IMG.ammo = new RenderImage("assets/hud/ammo.png")
	IMG.chat = new RenderImage("assets/hud/chat.png")
	IMG.chatMessage = new RenderImage("assets/chat_message.png")
	SPRITE.chat = new Sprite(IMG.chat, 1,1, 620,51)
	SPRITE.chatButton = new Sprite(IMG.chat, 3,5, 36,36, 0,51)
	IMG.emoteMenu = new RenderImage("assets/gui/emote.png")
	SPRITE.emoteButton = new Sprite(IMG.emoteMenu, 3,7, 36,36, 0,110)

	// MENUS
	IMG.menu = new RenderImage("assets/gui/menu.png")
	IMG.items = new RenderImage("assets/gui/items.png")
	SPRITE.items = new Sprite(IMG.items, 6,1, 30,30, 0,0, 1,1)

	// Chicken Customization
	HEADOFFSET = [ // Center of chicken head where hat should be placed
		[[64,1],[64,1],[66,2] ,[66,9],[64,2],[64,2],[4,62],[64,1]],
		[[89,3],[89,3],[86,10],[66,9],[64,2],[64,2],[4,62],[64,1]],
		[[63,2],[63,2],[66,2] ,[66,9],[64,2],[64,2],[4,62],[64,1]]
	]
	FACEOFFSET = [ // Center of chicken face where glasses should be placed
		[[64,1],[64,1],[66,2] ,[66,9],[64,2],[64,2],[4,62],[64,1]],
		[[89,3],[89,3],[86,10],[66,9],[64,2],[64,2],[4,62],[64,1]],
		[[63,2],[63,2],[66,2] ,[66,9],[64,2],[64,2],[4,62],[64,1]]
	]
	BODYOFFSET = [ // Center of chicken chin where accessory should be placed
		[[64,55],[64,55],[66,56],[66,63],[64,55],[64,55],[59,62],[64,55]],
		[[89,49],[89,49],[86,52],[66,63],[64,55],[64,55],[59,62],[64,55]],
		[[63,56],[63,56],[68,57],[66,63],[64,55],[64,55],[59,62],[64,55]]
	]
	CHICKENROTATION = [ // Rotation of chicken hat & accessory for each frame
		0,0,0,0,0,0,-Math.PI*0.5,0
	]

	// Load all items
	ITEMS = {
		// Categories
		head: {},
		face: {},
		body: {},
		furniture: {},
		item: {}
	}
	// List of all items to load
	ITEMS.head["tophat"] = {}
	ITEMS.head["snapback"] = {}
	ITEMS.head["hoodie"] = {}

	ITEMS.face["visors"] = {}

	ITEMS.body["scarf"] = {}
	ITEMS.body["chains"] = {}
	ITEMS.body["silverchains"] = {}
	ITEMS.body["beefcakeaccessories"] = {}
	ITEMS.body["alesanaccessories"] = {}

	ITEMS.item["seeds"] = {}

	for (const [category, list] of Object.entries(ITEMS)) {
		for (const [itemId, item] of Object.entries(list)) {
			// Load image, create sprite frames when image is loaded, and load hat centers from JSON
			item.name = ""
			item.description = ""
			item.cost = 0
			item.center = [[0.5, 0.7],[0.5, 0.7],[0.5, 0.7]]
			loadJSON(`assets/items/${category}/${itemId}.json`, (data) => {
				item.name = data.name
				item.description = data.description
				item.cost = data.cost
				if (data.center) {
					item.center = data.center
				}
			})
			let async = function() {
				item.sprite = new Sprite(item.image, 1, 3, item.image.w,(item.image.h-2)/3, 0,0, 1,1)
			}
			item.image = new RenderImage(`assets/items/${category}/${itemId}.png`, async)
		}
	}

	FONT.pixel = new RenderFont("Pixel", 16)
	FONT.big = new RenderFont("Arial", 40)
	FONT.hud = new RenderFont("Arial", 28)
	FONT.caption = new RenderFont("Arial", 20)
	FONT.nametag = new RenderFont("Arial", 16)
	FONT.description = new RenderFont("Arial", 18)
	FONT.speechBubble = new RenderFont("Courier New", 18)
	FONT.guiLabel = new RenderFont("Times New Roman", 20)
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

	// DIRECTORYTREE = fetch('/getDirectoryTree')
	// 	.then(response => {
	// 		if (!response.ok) { throw new Error('Failed to fetch directory tree'); };
	// 		return response.json()
	// 	})
	// 	.then(data => {
	// 		DIRECTORYTREE = data
	// 	})
	// 	.catch(error => { console.error(error) });
	// console.log(DIRECTORYTREE)