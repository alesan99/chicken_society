// Handles client-side log in logic

// Log-in into existing account.
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("login-button");
loginButton.addEventListener("click", (e) => {
	e.preventDefault();
	// Check all required fields
	if (!loginForm.checkValidity()) {
		loginForm.reportValidity();
		return;
	}

	const username = document.getElementById("username-field").value;
	const password = document.getElementById("password-field").value;
	const remember = document.getElementById("remember-login").value;

	// Send data securely using the Fetch API
	fetch("/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ username, password, remember }),
	})
		.then((response) => response.json())
		.then(data => {
			if (data.success === true) {
				setLoggedIn(true, username);
			}
			console.log("Server Response:", data);
		})
		.catch(error => {
			console.error("Error:", error);
		});
});

// Register new account.
const registerForm = document.getElementById("registerForm");
const registerButton = document.getElementById("register-button");
registerButton.addEventListener("click", (e) => {
	e.preventDefault();
	// Check all required fields
	if (!registerForm.checkValidity()) {
		registerForm.reportValidity();
		return;
	}

	const username = document.getElementById("register-username-field").value;
	const password = document.getElementById("register-password-field").value;
	const email = document.getElementById("register-email-field").value;
	// Send data securely using the Fetch API
	fetch("/register", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ username, password, email }),
	})
		.then(response => response.json())
		.then(data => {
			if (data.success === true) {
				setLoggedIn(true, username);
			}
			console.log("Server Response:", data);
		})
		.catch(error => {
			console.error("Error:", error);
		});
});

// Log out
const logoutButton = document.getElementById("logout-button");
logoutButton.addEventListener("click", (e) => {
	e.preventDefault();
	// Send data securely using the Fetch API
	fetch("/logout", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({}),
	})
		.then(response => response.json())
		.then(data => {
			if (data.success === true) {
				setLoggedIn(false);
				// Refresh
				if (data.success) {
					window.location.reload();
				}
			}
			console.log("Server Response:", data);
		})
		.catch(error => {
			console.error("Error:", error);
		});
});

// Get current login status
document.addEventListener("DOMContentLoaded", () => {
	fetch("/session", { credentials: "include" })
		.then(res => res.json())
		.then(data => {
			if (data.loggedIn) {
				setLoggedIn(true, data.username);
			} else {
				setLoggedIn(false);
			}
		});
});

function setLoggedIn(isLoggedIn, username) {
	// Update navbar
	const userDropdown = document.getElementById("user-dropdown");
	const userDropdownButton = document.getElementById("user-dropdown-button");
	const loginDropdown = document.querySelector("li.dropdown:has(#loginForm)");
	const registerDropdown = document.querySelector("li.dropdown:has(#registerForm)");
	if (isLoggedIn === true) {
		userDropdownButton.textContent = username;
		userDropdown.style.display = "";
		loginDropdown.style.display = "none";
		registerDropdown.style.display = "none";
	} else {
		userDropdown.style.display = "none";
		loginDropdown.style.display = "";
		registerDropdown.style.display = "";
	}
}