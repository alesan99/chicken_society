const loginForm = document.getElementById("login-stuff");
const loginButton = document.getElementById("login");

loginButton.addEventListener("click", (e) => {
    e.preventDefault();
    const username = loginForm("username").value;
    console.log(username);
    if (username === "Mikey") {
        alert("You have successfully logged in.");
        location.reload();
    } else {
        alert("Incorrect username or password.");
    }
}
);
