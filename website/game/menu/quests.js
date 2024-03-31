// Quests Menu
// Lists out all active quests and their steps

MENUS["questsMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

	load () {
		this.openTimer = 0

		this.buttons = {}
		this.buttons["close"] = new Button("X", ()=>{closeMenu()}, null, 740,128, 32,32)

		this.buttons["sort:all"] = new Button("All", ()=>{this.sortQuests("all")}, null, 255,148, 100,32)
		this.buttons["sort:incomplete"] = new Button("Incomplete", ()=>{this.sortQuests("incomplete")}, null, 360,148, 100,32)
		this.buttons["sort:complete"] = new Button("Complete", ()=>{this.sortQuests("complete")}, null, 465,148, 100,32)

		this.quests = []
		this.sorted = "all"
		this.sortQuests(this.sorted)
	}

	sortQuests (category) {
		this.buttons["sort:"+this.sorted].selected = false
		this.sorted = category
		this.buttons["sort:"+this.sorted].selected = true
		this.quests = []
		if (category == "all") {
			for (let questName in QuestSystem.getAllActiveQuests()) {
				this.quests.push(QuestSystem.getQuest(questName))
			}
			for (let questName in QuestSystem.getAllCompletedQuests()) {
				this.quests.push(QuestSystem.getQuest(questName))
			}
		} else if (category == "incomplete") {
			for (let questName in QuestSystem.getAllActiveQuests()) {
				this.quests.push(QuestSystem.getQuest(questName))
			}
		} else if (category == "complete") {
			for (let questName in QuestSystem.getAllCompletedQuests()) {
				this.quests.push(QuestSystem.getQuest(questName))
			}
		}
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
		DRAW.setColor(255,255,255, scale)
		DRAW.rectangle(this.x+20, this.y+80, this.w-40, this.h-100, 1.0, 0, 0, 0, 0.5)
		DRAW.setColor(180,180,200, scale)
		DRAW.setLineWidth(4)
		DRAW.line(this.x+22,this.y+82+this.h-100, this.x+22,this.y+82, this.x+22+this.w-40,this.y+82)

		// Text
		DRAW.setColor(112, 50, 16, scale)
		DRAW.setFont(FONT.caption)
		DRAW.text("Quests:", this.x+20, this.y+35, "left")

		let y = this.y+100
		let line = 0
		let size = 24
		for (let quest of this.quests) {
			// let quest = QuestSystem.getQuest(questName)
			DRAW.setColor(220,220,230, scale)
			DRAW.setLineWidth(2)
			DRAW.line(this.x+20, y+line*size+2, this.x+20+this.w-40, y+line*size+2)
			DRAW.setColor(0, 0, 0, scale)
			DRAW.text(quest.name, this.x+20, y+line*size, "left")

			for (let i=0; i<quest.progress.length; i++) {
				DRAW.setColor(220,220,230, scale)
				DRAW.line(this.x+20, y+line*size+size+2, this.x+20+this.w-40, y+line*size+size+2)
				DRAW.setColor(0, 0, 0, scale)
				DRAW.text(quest.progressDescription[i], this.x+40, y+line*size+20, "left")
				DRAW.text(quest.progress[i] + "/" + quest.progressFinish[i], this.x+470, y+line*size+size, "left")
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