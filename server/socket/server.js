const firebase = require('firebase');

module.exports = function (io)
{
    io.on('connection', (socket) => {
        var conversationId = null;
        socket.on('join', (information) => {
            var {room, currentUserId} = information;

            if (socket.room) {
                socket.leave(socket.room);
            }
            
            socket.room = room;
            console.log(currentUserId + " joined " + socket.room);

            conversationId = room;
            var conversationRef = firebase.database().ref(conversationId);

            conversationRef.endAt().limitToLast(1).on('child_added', (childSnapshot) => {
                if (childSnapshot.val().recipient === currentUserId) {
                    socket.emit("newMessage", childSnapshot.val());
                }
            });

            socket.join(socket.room);
        });

        socket.on('createMessage', (newEmail) => {
            console.log('createMessage');
            var newMessage = {
                sender: newEmail.sender,
                recipient: newEmail.recipient,
                message: newEmail.message
            };

            var conversationRef = firebase.database().ref(conversationId);
            var newMessRef = conversationRef.push(newMessage);
            conversationRef.child(newMessRef.key).set(newMessage);

            // socket.broadcast.to(conversationId).emit("newMessage", newMessage);
            conversationRef.child(newMessRef.key).on("child_added", (snapshot) => {
                console.log("storedSuccess", snapshot.val());
            });
        });

        socket.on('disconnect', () => {
            socket.leave(conversationId);
            console.log(socket.id + ' disconnected to server');
        });
    });
}