//NPC object, controls the position of another object along with interactable dialouge

class NPC {
	//Initialize: object, roam? radius in pixels of area to walk around
	constructor (obj, dialogue, roamRadius) {
		this.obj = obj
		obj.controller = this

        this.originX = this.obj.x
        this.originY = this.obj.y
		this.roamRadius = roamRadius
        this.walkTimer = 0

        this.dialogue = dialogue || [""]
        let range = 50
        this.trigger = WORLD.spawnObject("Trigger", new Trigger(PHYSICSWORLD, this.obj.x, this.obj.y, () => this.speak(), [-range,-range, range,-range, range,range, -range,range]))
	}

	// Update
	update(dt) {
		let char = this.obj

        this.walkTimer = (this.walkTimer + 6*dt)%(Math.PI*2)

		// walk around
        if (this.roamRadius) {
            let [dx, dy] = [Math.cos(this.walkTimer), Math.sin(this.walkTimer)]
            char.move(dx, dy)
        }

        this.trigger.setPosition(char.x, char.y)
	}

    speak() {
        let i = Math.floor(Math.random() * this.dialogue.length)
        this.obj.chatBubble(this.dialogue[i])
    }
}