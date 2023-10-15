//Load images, audio, and other data

BACKGROUND = []
IMG = []
SPRITE = []
ANIM = []
FONT = []

function loadGameAssets() {
	IMG.chicken = new RenderImage("assets/chicken.png")
	IMG.chicken.makeColorable()
	SPRITE.chicken = new Sprite(IMG.chicken, 2, 3, 0, 0, 96, 128, 97, 129)
	ANIM.walk = [0, 1]
    ANIM.dance = [1, 2, 3]
    ANIM.wave = [4, 5]

    BACKGROUND.hub = new RenderImage("assets/areas/hub.png")

	FONT.caption = new RenderFont("Arial", 20)
}