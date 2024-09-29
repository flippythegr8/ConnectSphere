// script.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed.");

    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", signup);
        console.log("Signup form listener attached.");
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", login);
        console.log("Login form listener attached.");
    }

    const dmForm = document.getElementById("dmForm");
    if (dmForm) {
        dmForm.addEventListener("submit", sendDM);
        console.log("DM form listener attached.");
    }

    const friendForm = document.getElementById("friendForm");
    if (friendForm) {
        friendForm.addEventListener("submit", addFriend);
        console.log("Friend form listener attached.");
    }
});

// Signup Function
function signup(event) {
    event.preventDefault();
    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    console.log("Signing up user:", username);

    // Create user with Firebase Auth
    auth.createUserWithEmailAndPassword(username + "@connectsphere.com", password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User created:", user.uid);

            // Save additional user data in Firestore
            return db.collection("users").doc(user.uid).set({
                username: username,
                friends: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert("Signup successful! You can now log in.");
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Error during signup:", error);
            alert(error.message);
        });
}

// Login Function
function login(event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    console.log("Attempting to log in with:", username);

    // Sign in with Firebase Auth
    auth.signInWithEmailAndPassword(username + "@connectsphere.com", password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User logged in:", user.uid);

            // Redirect to DMs
            window.location.href = "dms.html";
        })
        .catch((error) => {
            console.error("Error during login:", error);
            alert(error.message);
        });
}

// Send DM Function
function sendDM(event) {
    event.preventDefault();
    const recipientUsername = document.getElementById("dmUsername").value.trim();
    const message = document.getElementById("dmMessage").value.trim();

    console.log(`Sending DM to ${recipientUsername}: ${message}`);

    // Find recipient by username
    db.collection("users")
        .where("username", "==", recipientUsername)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                alert("Recipient not found.");
                throw new Error("Recipient not found.");
            }

            const recipientDoc = querySnapshot.docs[0];
            const recipientId = recipientDoc.id;

            // Save the message in Firestore
            return db.collection("messages").add({
                senderId: auth.currentUser.uid,
                recipientId: recipientId,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert("Message sent successfully!");
            document.getElementById("dmForm").reset();
        })
        .catch((error) => {
            console.error("Error sending DM:", error);
        });
}

// Add Friend Function
function addFriend(event) {
    event.preventDefault();
    const friendUsername = document.getElementById("friendUsername").value.trim();

    console.log(`Adding friend: ${friendUsername}`);

    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert("You need to be logged in to add friends.");
        return;
    }

    // Find friend by username
    db.collection("users")
        .where("username", "==", friendUsername)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                alert("User not found.");
                throw new Error("User not found.");
            }

            const friendDoc = querySnapshot.docs[0];
            const friendId = friendDoc.id;

            // Update current user's friends list
            return db.collection("users").doc(currentUser.uid).update({
                friends: firebase.firestore.FieldValue.arrayUnion(friendId)
            });
        })
        .then(() => {
            alert("Friend added successfully!");
            document.getElementById("friendForm").reset();
        })
        .catch((error) => {
            console.error("Error adding friend:", error);
        });
}
