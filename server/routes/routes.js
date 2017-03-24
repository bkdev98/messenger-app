const express = require('express');
const router = express.Router();
const firebase = require('firebase');
const usersRef = firebase.database().ref("users/");

const middleware = require("./../middleware/middleware");

router.get('/', [
        middleware.authenticate,
        middleware.info,
        middleware.getuserlist
    ], (req, res) => {
    res.render('index.hbs', {
        userList: req.userList,
        currentUser: req.currentUser,
        title: "Messenger | Home"
    }); 
});

router.get('/messengers/:id', [   
        middleware.authenticate,
        middleware.info,
        middleware.gettargetuser,
        middleware.getuserlist,
        middleware.getmessagelist
    ], (req, res) => {
    var conversationId = req.conversationId;

    res.render('conversation.hbs', {
        messages: req.messageList,
        userList: req.userList,
        targetUser: req.targetUser,
        currentUser: req.currentUser,
        conversationId
    });
});

router.get('/login', (req, res) => {
    res.render('login.hbs');
});

router.post('/login', (req, res) => {
    const { uid, idToken } = req.body;

    usersRef.child(uid).update({ 
        idToken,
        connection: 'online'
    })
        .then((user) => {
            res.send({redirect: '/'});
        })
        .catch((e) => {
            res.redirect('/login');
        })
})

router.get('/info', [middleware.authenticate], (req, res) => {
    res.render('info.hbs', {
        uid: req.currentUser.uid
    });
});

router.post('/info', [middleware.authenticate], (req, res) => {
    var displayName = req.body.name;
    usersRef.child(req.currentUser.uid).update({ displayName })
        .then(() => {
            res.redirect('/');
        })
        .catch((e) => {
            res.redirect('/info');
        })
});

router.get('/register', (req, res) => {
    res.render('register.hbs');
});

router.post('/register', (req, res) => {
    const newUser = {
        email: req.body.email,
        idToken: req.cookies.token,
        displayName: null,
        createdAt: new Date().getTime(),
        connection: "online"
    }

    usersRef.child(req.body.uid).once("value", (snapshot) => {
        if(snapshot.val()) {
            usersRef.child(req.body.uid).update({idToken: req.cookies.token})
                .then(() => {
                    res.send({redirect: '/'});
                });
        } else {
            usersRef.child(req.body.uid).set(newUser)
                .then((user) => {
                    res.send({redirect: '/info'});
                })
                .catch((e) => {
                    console.log(e);
                    res.redirect('/register');
                });
        }
    });
});

router.get('/logout', [middleware.authenticate], (req, res) => {
    res.clearCookie('token');
    usersRef.child(req.currentUser.uid).update({ 
        idToken: null,
        connection: 'offline'
    })
        .then((user) => {
            res.redirect('/login');
        })
        .catch((e) => {
            res.redirect('/login');
        })
});

module.exports = router;
