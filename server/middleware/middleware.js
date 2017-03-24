const firebase = require('firebase');

const usersRef = firebase.database().ref("users/");
const conversationRef = firebase.database().ref("/");

module.exports = {
    //  Get token from cookies, query to usersRef
    //  return current user data to req.currentUser
    //  redirect if user do not authenticate
    authenticate: (req, res, next) => {
        if (!req.cookies.token) {
            return res.redirect('/login');
        }
        var token = req.cookies.token;
        usersRef.orderByChild("idToken").equalTo(token).once("value", (snapshot) => {
            var uid = Object.keys(snapshot.val())[0];
            var avatarId = 'user.png';
            user = {
                uid,
                email: snapshot.val()[uid].email,
                displayName: snapshot.val()[uid].displayName,
                avatarId,
                createdAt: snapshot.val()[uid].createdAt
            }
            req.currentUser = user;
            next();
        }, (e) => {
            res.redirect('/login');
        })
    },
    //  Get token from cookies, query to usersRef and 
    //  Redirect user if not have enough information
    info: (req, res, next) => {
        var token = req.cookies.token;

        usersRef.orderByChild("idToken").equalTo(token).once("value", (snapshot) => {
            if (snapshot.val().displayName !== null) {
                next();
            } else {
                res.redirect('/info');
            }
        }, (e) => {
            res.redirect('/login');
        })
    },
    //  Get target user ID from req.params
    //  Query to usersRef by this ID and
    //  Return this user data
    gettargetuser: (req, res, next) => {
        var id = req.params.id;

        usersRef.orderByKey().equalTo(id).once("value", (snapshot) => {
            if (!snapshot) {
                res.redirect('/');
            } else {
                req.targetUser = snapshot.val()[id];
                req.targetUser.uid = id;
                req.targetUser.avatarId = 'user.png';
                next();
            }
        });
    },
    //  Query to usersRef and return full list of users
    getuserlist: (req, res, next) => {
        var userList = [];
        usersRef.once('value', (snapshot) => {
            Object.keys(snapshot.val()).map((key) => {
                var { email, displayName, avatarId, connection } = snapshot.val()[key];
                var avatarId = 'user.png';
                var user = {
                    email,
                    displayName,
                    uid: key,
                    avatarId,
                    connection
                }
                userList.push(user);
            });
        })
            .then(() => {
                var filteredUserList = [];

                filteredUserList = userList.filter((user) => {
                    return user.uid !== req.currentUser.uid
                });

                req.userList = filteredUserList;
                next();
            })
    },
    //  Create keyTest using of currentUser & targetUser
    //  Query to conversationRef with this keyTest
    //  Return full list of messages if not empty
    //  Return conversationId equal to this keyTest
    getmessagelist: (req, res, next) => {
        if (req.currentUser.createdAt > req.targetUser.createdAt) {
            keyTest = (req.currentUser.email + '-' + req.targetUser.email).replace(/\./g, '-');
        } else {
            keyTest = (req.targetUser.email + '-' + req.currentUser.email).replace(/\./g, '-');
        }

        var messageList = [];

        conversationRef.orderByKey().on("child_added", (snapshot) => {
            if (snapshot.key === keyTest) {
                conversationRef.child(snapshot.key).once("value", snapshot => {
                    var messages = snapshot.val();

                    Object.keys(messages).forEach((key) => {
                        messageList.push(messages[key]);
                    });
                    req.messageList = messageList;
                    req.conversationId = snapshot.key;
                    next();
                });
            }
        });

        if (!req.conversationId) {
            req.messageList = [];
            req.conversationId = keyTest;
            next();    
        }
    }
}
