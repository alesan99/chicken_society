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
	SPRITE.chicken = new Sprite(IMG.chicken, 8, 6, 0, 0, 100, 128, 101, 129)
	ANIM.stand = [0]
	ANIM.walk = [1, 2]
    ANIM.dance = [1, 2, 3]
	ANIM.sit = [3]
    ANIM.wave = [4, 5]

	IMG.chatBubble = new RenderImage("assets/chat_bubble.png")

    BACKGROUND.hub = new RenderImage("assets/areas/hub.png")

	FONT.caption = new RenderFont("Arial", 20)
	FONT.chatBubble = new RenderFont("Courier New", 18)
}