//Load images, audio, and other data

BACKGROUND = []
IMG = []
SPRITE = []
ANIM = []

let newImage = function(src) {
	let image = new Image();
	image.src = "assets/" + src;
	return image
}

function loadGameAssets() {
	IMG.chicken = newImage("chicken.png")
	SPRITE.chicken = new Sprite(IMG.chicken, 2, 3, 0, 0, 96, 128)
	ANIM.walk = [0, 1]
    ANIM.dance = [1, 2, 3]
    ANIM.wave = [4, 5]

    BACKGROUND.hub = newImage("areas/hub.png")
}