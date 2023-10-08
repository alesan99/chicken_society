//Load images, audio, and other data

IMG = []

let newImage = function(src) {
    let image = new Image();
    image.src = "assets/" + src;
    return image
}

function loadGameAssets() {
    IMG.chicken = newImage("chicken.png")
}