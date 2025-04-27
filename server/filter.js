// Filter words
const fs = require("fs");
const path = require("path");
const badWordsFilePath = path.join(__dirname, "badwords.json");
const ProfanityFilter = require("deep-profanity-filter");

let wordFilter;
function updateWordFilter(badWordsList=[], whitelistList=[]) {
	wordFilter = ProfanityFilter.preprocessWordLists(badWordsList, whitelistList);
}
updateWordFilter();

fs.readFile(badWordsFilePath, "utf8", (err, data) => {
	if (err) {return;}
	try {
		let badWords = JSON.parse(data);
		updateWordFilter(badWords, []);
	} catch (parseError) {
		console.error("Error parsing badwords.json:", parseError);
	}
});

function hasBadWords(str) {
	let processedStr = ProfanityFilter.textToLatin(str);
	return ProfanityFilter.doesContainBadWords(processedStr, wordFilter);
}

module.exports = { hasBadWords };