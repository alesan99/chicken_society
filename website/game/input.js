// Recieve keyboard inputs

window.addEventListener("keydown", keyPressed)
window.addEventListener("keyup", keyReleased)

arrowKeys = {
    left: false,
    right: false,
    up: false,
    down: false
}

function keyPressed(event) {
    switch (event.key) {
        case "ArrowLeft":
            arrowKeys.left = true
            break
        case "ArrowUp":
            arrowKeys.up = true
            break
        case "ArrowRight":
            arrowKeys.right = true
            break
        case "ArrowDown":
            arrowKeys.down = true
            break
        default:
            stateKeyPress(event.key)
    }
}
function keyReleased(event) {
    if  (event) {
        switch (event.key) {
            case "ArrowLeft":
                arrowKeys.left = false
                break
            case "ArrowUp":
                arrowKeys.up = false
                break
            case "ArrowRight":
                arrowKeys.right = false
                break
            case "ArrowDown":
                arrowKeys.down = false
                break
            default:
                stateKeyRelease(event.key)

        }
    }
}