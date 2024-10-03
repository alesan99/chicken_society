// Audio system
// Controls music playback

// Asset loading

const AudioSystem = (function() {
	let currentMusic = false

	let sounds = []
	let music = []
	
	const functions = {
		newMusic(path) {
			// These need to be streamed
			return new Howl({
				src: [path],
				loop: true,
				html5: true
			});
		},

		newSound(path) {
			// These can be loaded in memory
			return new Howl({
				src: [path]
			});
		},

		update(dt) {
			// Fade music here
		},

		playMusic(src) {
			this.stopMusic();
			src.volume(1.0); // Reset if it was faded (i wish i were faded)
			src.play();
			currentMusic = src;
		},

		setMusicPosition(time) {
			if (currentMusic) {
				currentMusic.seek(time);
			}
		},

		getMusicPosition() {
			if (currentMusic) {
				return currentMusic.seek();
			}
			return 0;
		},

		stopMusic() {
			if (currentMusic) {
				currentMusic.stop();
				currentMusic = false;
			}
		},

		playSound(src) {
			src.play();
		},

		stopSound(src) {
			src.stop();
		},

		fadeOutMusic(time=1) {
			if (currentMusic) {
				currentMusic.fade(1.0, 0.0, 500);
			}
		},

		stopAudio() {
			this.stopMusic();
			// TODO: Stop all sound effects
		},

		setVolume(vol) {
			Howler.volume(vol)
		}
	};
	
	return functions; })()

export default AudioSystem;