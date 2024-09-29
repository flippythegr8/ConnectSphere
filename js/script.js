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

// Function to send a friend request
function addFriend(event) {
    event.preventDefault();
    const friendUsername = document.getElementById("friendUsername").value.trim();

    console.log(`Sending friend request to: ${friendUsername}`);

    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert("You need to be logged in to send friend requests.");
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

            if (friendId === currentUser.uid) {
                alert("You cannot send a friend request to yourself.");
                throw new Error("Self friend request.");
            }

            // Check if already friends
            return db.collection("users").doc(currentUser.uid).get();
        })
        .then((doc) => {
            const userData = doc.data();
            if (userData.friends.includes(friendId)) {
                alert("You are already friends with this user.");
                throw new Error("Already friends.");
            }

            // Check if a pending friend request exists
            return db.collection("friendRequests")
                .where("fromId", "==", currentUser.uid)
                .where("toId", "==", friendId)
                .where("status", "==", "pending")
                .get();
        })
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                alert("Friend request already sent and pending.");
                throw new Error("Friend request pending.");
            }

            // Create a new friend request
            return db.collection("friendRequests").add({
                fromId: currentUser.uid,
                toId: friendId,
                status: "pending",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert("Friend request sent successfully!");
            document.getElementById("friendForm").reset();
        })
        .catch((error) => {
            console.error("Error sending friend request:", error);
        });
}

// script.js

// ... (Existing code)

// Function to fetch and display friend requests
function fetchFriendRequests() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    db.collection("friendRequests")
        .where("toId", "==", currentUser.uid)
        .where("status", "==", "pending")
        .orderBy("timestamp", "desc")
        .onSnapshot((querySnapshot) => {
            const friendRequestsUl = document.getElementById("friendRequestsUl");
            friendRequestsUl.innerHTML = ""; // Clear existing requests

            if (querySnapshot.empty) {
                friendRequestsUl.innerHTML = "<li>No pending friend requests.</li>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const request = doc.data();
                const requestId = doc.id;
                const fromId = request.fromId;

                // Fetch sender's username
                db.collection("users").doc(fromId).get()
                    .then((userDoc) => {
                        if (userDoc.exists) {
                            const fromUsername = userDoc.data().username;

                            // Create list item
                            const li = document.createElement("li");
                            li.textContent = fromUsername;

                            // Create buttons
                            const buttonsDiv = document.createElement("div");
                            buttonsDiv.classList.add("request-buttons");

                            const acceptBtn = document.createElement("button");
                            acceptBtn.textContent = "Accept";
                            acceptBtn.classList.add("accept");
                            acceptBtn.addEventListener("click", () => {
                                acceptFriendRequest(requestId, fromId);
                            });

                            const declineBtn = document.createElement("button");
                            declineBtn.textContent = "Decline";
                            declineBtn.classList.add("decline");
                            declineBtn.addEventListener("click", () => {
                                declineFriendRequest(requestId);
                            });

                            buttonsDiv.appendChild(acceptBtn);
                            buttonsDiv.appendChild(declineBtn);

                            li.appendChild(buttonsDiv);
                            friendRequestsUl.appendChild(li);
                        }
                    });
            });
        })
        .catch((error) => {
            console.error("Error fetching friend requests:", error);
        });
}

// Function to accept a friend request
function acceptFriendRequest(requestId, fromId) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Update the friend request status
    db.collection("friendRequests").doc(requestId).update({
        status: "accepted"
    })
    .then(() => {
        // Add each user to the other's friends list
        const batch = db.batch();

        const currentUserRef = db.collection("users").doc(currentUser.uid);
        const fromUserRef = db.collection("users").doc(fromId);

        batch.update(currentUserRef, {
            friends: firebase.firestore.FieldValue.arrayUnion(fromId)
        });

        batch.update(fromUserRef, {
            friends: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });

        return batch.commit();
    })
    .then(() => {
        alert("Friend request accepted!");
    })
    .catch((error) => {
        console.error("Error accepting friend request:", error);
    });
}

// Function to decline a friend request
function declineFriendRequest(requestId) {
    // Update the friend request status
    db.collection("friendRequests").doc(requestId).update({
        status: "declined"
    })
    .then(() => {
        alert("Friend request declined.");
    })
    .catch((error) => {
        console.error("Error declining friend request:", error);
    });
}

// Modify fetchFriends to also listen for real-time updates
function fetchFriends() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    db.collection("users").doc(currentUser.uid).onSnapshot((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            const friendsIds = userData.friends;
            const friendsUl = document.getElementById("friendsUl");
            friendsUl.innerHTML = ""; // Clear existing list

            if (friendsIds.length === 0) {
                friendsUl.innerHTML = "<li>No friends added yet.</li>";
                return;
            }

            friendsIds.forEach((friendId) => {
                db.collection("users").doc(friendId).get()
                    .then((friendDoc) => {
                        if (friendDoc.exists) {
                            const friendData = friendDoc.data();
                            const li = document.createElement("li");
                            li.textContent = friendData.username;
                            li.dataset.friendId = friendId;
                            li.addEventListener("click", () => {
                                loadChat(friendId, friendData.username);
                            });
                            friendsUl.appendChild(li);
                        }
                    });
            });
        }
    });
}

// Call fetchFriendRequests when user is logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User is logged in:", user.uid);
        fetchFriends();
        fetchFriendRequests(); // Fetch friend requests
    } else {
        console.log("No user is logged in.");
        window.location.href = "login.html";
    }
});
