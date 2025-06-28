const loginForm = document.getElementById("login-stuff");
const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");
const registerForm = document.getElementById("register-stuff");
loginButton.addEventListener("click", (e) => {
	e.preventDefault();
	const username = document.getElementById("username-field").value;
	const password = document.getElementById("password-field").value;

	// Send data securely using the Fetch API
	fetch("/login-endpoint", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ username, password }),
	})
		.then((response) => {
			response.json();
		})
		.then(data => {
			console.log("Server Response:", data);
		})
		.catch(error => {
			console.error("Error:", error);
		});
});
registerButton.addEventListener("click", (e) => {
	e.preventDefault();
	const registerUsername = document.getElementById("register-username-field").value;
	const registerPassword = document.getElementById("register-password-field").value;
	const registerEmail = document.getElementById("register-email-field").value;
	// Send data securely using the Fetch API
	fetch("/register", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ registerUsername, registerPassword, registerEmail }),
	})
		.then(response => response.json())
		.then(data => {
			console.log("Server Response:", data);
		})
		.catch(error => {
			console.error("Error:", error);
		});
});