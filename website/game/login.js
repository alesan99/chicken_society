const loginForm = document.getElementById("login-stuff");
const loginButton = document.getElementById("login");

loginButton.addEventListener("click", (e) => {
    e.preventDefault();
    const username = document.getElementById("username-field").value;
    const password = document.getElementById("password-field").value;
    // console.log(username);
    // if (username === "Mikey") {
    //     alert("You have successfully logged in.");
    //     // location.reload();
    // } else {
    //     alert("Incorrect username or password.");
    // }

    // Send data securely using the Fetch API
    fetch('/login-endpoint', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server Response:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
});