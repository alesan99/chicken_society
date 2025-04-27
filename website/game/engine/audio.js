// Audio system
// Controls music playback and manages audio assets

const AudioSystem = (function() {
	let currentMusic = false;

	let sounds = [];
	let music = [];

	let masterVolume = 1.0;
	let musicVolume = 1.0;
	let sfxVolume = 1.0;
	
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
			src.rate(1.0);
			src.volume(musicVolume); // Reset if it was faded (i wish i were faded)
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

		setMusicSpeed(speed) {
			if (currentMusic) {
				currentMusic.rate(Math.min(Math.max(speed, 0.5), 4.0));
			}
		},

		stopMusic() {
			if (currentMusic) {
				currentMusic.stop();
				currentMusic = false;
			}
		},

		playSound(src) {
			src.volume(sfxVolume);
			src.play();
		},

		stopSound(src) {
			src.stop();
		},

		fadeOutMusic(time=0.5) {
			if (currentMusic) {
				currentMusic.fade(musicVolume, 0.0, time*1000);
			}
		},

		stopAudio() {
			this.stopMusic();
			// TODO: Stop all sound effects
		},

		setVolume(vol, musicVol, sfxVol) {
			Howler.volume(vol);
			masterVolume = vol;
			if (musicVol !== undefined) {
				musicVolume = musicVol;
			}
			if (sfxVol !== undefined) {
				sfxVolume = sfxVol;
			}
		}
	};
	
	return functions; })();

export default AudioSystem;