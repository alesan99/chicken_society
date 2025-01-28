// Handles any misc. GET requests sent to server (For testing it would be localhost:3000 probably)
const {app} = require("../server.js");
const fs = require('fs'); // File system
const path = require('path');

// Send directory tree if requested at url "localhost:3000/getDirectoryTree"
directoryTree = {} // Build directory tree
getDirectoryTree("./website")
	.then((tree) => {
		directoryTree = tree
	})
	.catch((error) => {
		console.log("Error: Unable to read directory tree")
	});

app.get('/getDirectoryTree', (req, res) => {
	// Someone requested the directory tree! Should already be loaded so just send it.
	console.log("Someone requested the directory tree.")
	res.json(directoryTree)
});

// Function to read a directory and build a tree
function getDirectoryTree(dPath) {
	const directoryPath = dPath;
	
	return new Promise((resolve, reject) => {
		fs.readdir(directoryPath, async (err, files) => {
			try {
				if (err) {
					reject(err);
				} else {
					const files = await fs.promises.readdir(directoryPath);

				const tree = {
					name: path.basename(directoryPath),
					type: 'directory',
					children: [],
				};

				const childPromises = files.map(async (file) => {
					const filePath = path.join(directoryPath, file);
					const stats = await fs.promises.stat(filePath);

					if (stats.isDirectory()) {
						// If its a directory, recursively call this function
						const subTree = await getDirectoryTree(filePath);
						tree.children.push(subTree);
					} else {
						tree.children.push({
							name: file,
							type: 'file',
						});
					}
				});

				// Wait for all child promises to resolve
				await Promise.all(childPromises);
			
				resolve(tree);
			};
		} catch (err) {
			reject(err);
		}
		});
	});
}

// Recieve payment confirmation
app.post('/donation', (req, res) => {
	const data = req.body;
	console.log("Recieved donation: ", data);
});

module.exports = {
};