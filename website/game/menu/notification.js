// Notification
// A little popup that appears at the top of the screen

const Notify = (function() {
	let notifications = [];
	
	const notifyFunctions = {
		// Create new notification
		new: function(text, duration=3, color=[0,0,0]) {
			notifications.push({
				text: text,
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
			// Border
			DRAW.setColor(255,255,255,0.8)
			DRAW.rectangle(700, 15, 300, 32*notifications.length, "fill")
			DRAW.setColor(0,0,0)
			DRAW.rectangle(700, 15, 300, 32*notifications.length, "line")
			DRAW.setFont(FONT.description)
			// Text
			for (let i = 0; i < notifications.length; i++) {
				const notification = notifications[i];
				DRAW.setColor(...notification.color)
				DRAW.text(notification.text, 700 +3, 15+i*32 + 26, "left")
			}
		}
	}
	return notifyFunctions; })()