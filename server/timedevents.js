// Timed Events System

// Determines when a seasonal event is active.

const { time } = require('console');
const fs = require('fs');
// JSON5
const JSON5 = require('json5');

const TimedEvents = (function() {
	let timedEventData = {};
	let activeTimedEvents = {};

	let previousTime = 0;
	
	const functions = {
		// Load all information about timed events, so server knows which event times to check.
		loadTimedEvents: function() {
			// The current directory is root/server/
			// Get all directories inside root/websites/assets/timedevents/
			// Then read config.json5 in each directory
			let timedEventsDir = "website/assets/timedevents/";
			let timedEvents = fs.readdirSync(timedEventsDir);
			for (let i = 0; i < timedEvents.length; i++) {
				let timedEvent = timedEvents[i];
				let configPath = timedEventsDir + timedEvent + "/config.json5";
				let config = JSON5.parse(fs.readFileSync(configPath));
				timedEventData[timedEvent] = config;
				activeTimedEvents[timedEvent] = false; // Not active
			}
		},

		update: function() {
			console.log("Updating timed events");
			let time = new Date();

			let eventsChanged = false;
			// Check if any timed events are active
			for (let timedEventName in timedEventData) {
				let timedEvent = timedEventData[timedEventName]
				let isActive = activeTimedEvents[timedEventName]
				let isActiveNow = this.getActive(timedEvent, time)
				if (isActiveNow != isActive) {
					if (isActiveNow) {
						// Enable timed event 
						activeTimedEvents[timedEventName] = true
					} else if (!isActiveNow) {
						// Disable timed event
						delete activeTimedEvents[timedEventName]
					}
					eventsChanged = true;
				}
			}

			previousTime = time;
			return eventsChanged;
		},

		getActive: function(event, timeOfDay) {
			// let hour = timeOfDay.getHours(); // 23:00
			let dayOfWeek = timeOfDay.getDay();
			let month = timeOfDay.getMonth();
			let dayOfMonth = timeOfDay.getDate();
			let year = timeOfDay.getFullYear();
			let day = timeOfDay.getDate();

			// Is it the right time?
			if (event.type == "daily") {
				// event.time = HH:MM
				// event.duration = HH:MM
				let start_hour = event.time.split(":")[0]
				let duration_hour = event.duration.split(":")[0]
				let start_time = new Date(year, month, day, start_hour, 0)
				let end_time = new Date(year, month, day, start_hour, 0)
				end_time.setHours(end_time.getHours() + duration_hour)
				if (timeOfDay >= start_time && timeOfDay < end_time) {
					return true;
				}
			// Is it the right day of the week?
			} else if (event.type == "weekly") {
				// event.day = "Monday", "Tuesday", etc.
				// event.days = number of days the event lasts
				let start_day = this.getWeekDayID(event.day) // 0-6, corresponds to the day of the week
				let end_day = (start_day + event.days)%7 // 0-6 last day of event, non-inclusive
				let current_day = timeOfDay.getDay() // 0-6
				// Relative to start_day, is current_day between desired day range?
				if ((current_day-start_day)%7 >= 0 && (current_day-start_day)%7 < (end_day-start_day)%7) {
					return true;
				}
			// Is it the right date?
			} else if (event.type == "yearly") {
				// event.date = MM/DD
				// event.days = number of days the event lasts
				let start_month = event.date.split("/")[0] - 1 // 0-11 month
				let start_day = event.date.split("/")[1]
				let start_date = new Date(year, start_month, start_day)
				let end_date = new Date(year, start_month, start_day)
				end_date.setDate(end_date.getDate() + event.days)
				if (timeOfDay > start_date && timeOfDay < end_date) {
					return true;
				}
			}
			return false;
		},

		// Return array of timed event name strings
		getActiveTimedEvents: function() {
			let activeTimedEventsArray = [];
			for (let timedEventName in activeTimedEvents) {
				if (activeTimedEvents[timedEventName]) {
					activeTimedEventsArray.push(timedEventName);
				}
			}
			return activeTimedEventsArray;
		},

		getWeekDayID: function(dayString) {
			let days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
			dayString = dayString.toLowerCase();
			for (let i = 0; i < days.length; i++) {
				if (dayString === days[i]) {
					return i;
				}
			}
		},

		getWeekDayName: function(dayID) {
			let days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
			return days[dayID]
		},
	};
	
	return functions; })()

module.exports = {
	TimedEvents
};