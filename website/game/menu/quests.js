// Quests Menu
// Lists out all active quests and their steps

MENUS["questsMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

    load (config) {
		this.openTimer = 0

		this.buttons = {}

		this.quests = QuestSystem.getAllActiveQuests()
    }

	keyPress(key) {
	}

	keyRelease(key) {
	}

	mouseClick(button, x, y) {
		return super.mouseClick(button, x, y)
	}

	mouseRelease(button, x, y) {
		return super.mouseRelease(button, x, y)
	}
	
	draw() {
        // Window
		let scale = 1
		if (this.openTimer < 1) {
			scale = easing("easeOutBack", this.openTimer)
		}
        DRAW.image(IMG.menu, null, this.x+this.w*0.5, this.y+this.h*0.5, 0, scale, scale, 0.5, 0.5)
		DRAW.setColor(255,255,255,1.0)
		DRAW.rectangle(this.x+20, this.y+80, this.w-40, this.h-100, 1.0, 0, 0, 0, 0.5)

        // Text
        DRAW.setColor(112, 50, 16, scale)
        DRAW.setFont(FONT.caption)
		DRAW.text("Quests", 512, this.y+38, "center")

		let y = this.y+100
		let line = 0
		for (let questName in this.quests) {
			let quest = QuestSystem.getQuest(questName)
			DRAW.text(quest.name, this.x+20, y+line*20, "left")
			for (let i=0; i<quest.progress.length; i++) {
				DRAW.text(quest.progressDescription[i], this.x+40, y+line*20+20, "left")
				DRAW.text(quest.progress[i] + "/" + quest.progressFinish[i], this.x+470, y+line*20+20, "left")
				line += 1
			}

			line += 1
		}

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
	}
}()