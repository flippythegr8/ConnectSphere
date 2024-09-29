// script.js

console.log("script.js is loaded."); // Confirm script load

// Load users from localStorage or initialize to an empty array
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null; // Keep track of the logged-in user

// Function to handle user signup
function signup(event) {
    event.preventDefault();
    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    console.log("Signing up user:", username, password); // Debugging statement

    // Check if user already exists
    if (users.some(user => user.username === username)) {
        alert("Username already exists. Please choose another one.");
        return;
    }

    // Add new user
    users.push({ username, password, friends: [] });
    localStorage.setItem('users', JSON.stringify(users)); // Save users to localStorage

    // Debugging: Check localStorage directly
    console.log("Users after signup:", users);

    alert("Signup successful! You can now log in.");
    window.location.href = "login.html"; // Redirect to login
}

// Function to handle user login
function login(event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // Load users from localStorage to ensure we have the latest data
    users = JSON.parse(localStorage.getItem('users')) || []; // Update users array

    // Debugging: Log current users to console
    console.log("Current Users:", users);

    // Check user credentials
    const user = users.find(user => user.username === username && user.password === password);
    console.log("Attempting to log in with:", username, password);
    
    if (user) {
        currentUser = user; // Set current user
        alert(`Welcome, ${username}!`);
        window.location.href = "dms.html"; // Redirect to DMs
    } else {
        alert("Invalid username or password. Please try again.");
    }
}

// Function to send a DM
function sendDM(event) {
    event.preventDefault();
    const recipientUsername = document.getElementById("dmUsername").value.trim();
    const message = document.getElementById("dmMessage").value.trim();

    // Check if recipient exists
    const recipient = users.find(user => user.username === recipientUsername);
    if (!recipient) {
        alert("User not found.");
        return;
    }

    // Here you would typically send the message to a server or store it
    alert(`Message sent to ${recipientUsername}: ${message}`);
}

// Function to add a friend
function addFriend(event) {
    event.preventDefault();
    const friendUsername = document.getElementById("friendUsername").value.trim();

    const friend = users.find(user => user.username === friendUsername);
    if (!friend) {
        alert("User not found.");
        return;
    }

    if (!currentUser.friends.includes(friendUsername)) {
        currentUser.friends.push(friendUsername);
        localStorage.setItem('users', JSON.stringify(users)); // Update localStorage with new friend
        alert(`Added ${friendUsername} as a friend!`);
    } else {
        alert(`${friendUsername} is already your friend.`);
    }
}

// Attach event listeners after DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed."); // Confirm DOM loaded

    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", signup);
        console.log("Signup form listener attached."); // Debugging
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", login);
        console.log("Login form listener attached."); // Debugging
    }

    const dmForm = document.getElementById("dmForm");
    if (dmForm) {
        dmForm.addEventListener("submit", sendDM);
        console.log("DM form listener attached."); // Debugging
    }

    const friendForm = document.getElementById("friendForm");
    if (friendForm) {
        friendForm.addEventListener("submit", addFriend);
        console.log("Friend form listener attached."); // Debugging
    }
});
