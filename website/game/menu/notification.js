// Notification
// A little popup that appears at the top of the screen

const Notify = (function() {
	let notifications = [];
	
	const notifyFunctions = {
		// Create new notification
		new: function(text, duration=3, color=[0,0,0]) {
			DRAW.setFont(FONT.description)
			let wrappedText = DRAW.wrapText(text, 300 - 6)
			notifications.push({
				text: wrappedText,
				lines: wrappedText.length,
				timer: duration, // Duration in seconds
				duration: duration,
				color: color
			})
		},

		// Check if notification should expire
		update: function(dt) {
			for (let i = 0; i < notifications.length; i++) {
				const notification = notifications[i];
				notification.timer -= dt
				if (notification.timer <= 0) {
					notifications.splice(i, 1)
				}
			}
		},

		// Render all notifications
		draw: function() {
			if (notifications.length == 0) {
				return
			}
			DRAW.setFont(FONT.description)

			let x = 700
			let y = 15
			for (let i = 0; i < notifications.length; i++) {
				const notification = notifications[i];

				// Border
				DRAW.setColor(255,255,255,0.8)
				DRAW.rectangle(x, y, 300, 32*notification.lines, "fill")
				DRAW.setColor(0,0,0)
				DRAW.rectangle(x, y, 300, 32*notification.lines, "line")

				// Text
				DRAW.setColor(...notification.color)

				for (line = 0; line < notification.lines; line++) {
					DRAW.text(notification.text[line], x +3, y+line*30 + 25, "left")
				}
				y += notification.lines*32
			}
		}
	}
	return notifyFunctions; })()