const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const bodyParser = require('body-parser');
const path = require('path');
const hbs = require('hbs');
const cookieParser = require('cookie-parser');

//  Firebase Configurations
const firebase = require('firebase');
const firebaseConfig = require('./config/firebase.json');
firebase.initializeApp(firebaseConfig);
const usersRef = firebase.database().ref("users/");

const app = express();

//  Static Files
app.use('/css', express.static(__dirname + '/../public/css'));
app.use('/js', express.static(__dirname + '/../public/js'));
app.use('/fonts', express.static(__dirname + '/../public/fonts'));
app.use('/uploads', express.static(__dirname + '/../public/uploads'));

//  Storing Token
app.use(cookieParser());

//  Create application/x-www-form-urlencoded Parser
app.use(bodyParser.urlencoded({
  extended: true
}));

//  View Engine: Handlebars
app.set('view engine', 'hbs');
//  Handlebars Helper If Condition Using for Identify Messages
hbs.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

//  Express Routers
app.use(require('./routes/routes'));

//  SocketIO
const server = http.createServer(app);
const io = socketIO(server);
require('./socket/server')(io);

//  Listen PORT
const port = process.env.PORT || 3001;
server.listen(port, () => {
    console.log(`Started on port ${port}`);
});
