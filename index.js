import { Server } from "socket.io";
import  { Theme } from "./data/theme.js"
import m from "./data/message.js"
import { v4 as uuidv4 } from 'uuid';

const io = new Server({ cors: "https://localhost:3001"});


let themesList = new Array();

/// мапа сообщений, где ключ - id темы, а значение - массив сообщений для нее
let messagesMap = new Map();

io.on("connection", (socket) => {
    function emitThemes(){
        io.emit("themes", themesList);
    }

    console.log("New connection", socket.id);
    socket.send(socket.id);
    emitThemes();

    socket.on("addNewTheme", (value) => {
        
        let title = value.title;
        let id = uuidv4();
        let isCanRing = value.isCanRing;
        let userId = socket.id;
        let newTheme = new Theme(title, id, isCanRing, userId);
        
        console.log("new theme", newTheme);

        themesList.push(newTheme)

        socket.join(id);
        emitThemes();
        io.emit("createdTheme", newTheme);
        messagesMap.set(id, []);
    });

    socket.on("deleteTheme", (id) => {
        console.log(id);
        const index = themesList.indexOf(themesList.find((e) => e.id === id));
        if(index !== "undefined"){
            themesList.splice(index, 1);
        }
        
        emitThemes();
        messagesMap.delete(id);
    });

    socket.on('leave', (room) => {
        console.log('leave from room');
        io.to(room).emit('disconnected', socket.id);
        socket.leave(room);
    });

    socket.on("selectTheme", (roomId) => {
        socket.join(roomId);
        const index = themesList.indexOf(themesList.find((e) => e.id === roomId));
        const creatorId = themesList[index].userId;
        themesList.splice(index, 1);
        emitThemes();
        io.to(roomId).emit('join', roomId);
        io.to(roomId).emit('creatorId', creatorId);
        io.to(roomId).emit('interlocoutorId', socket.id);
    });

    socket.on("sendMessage", (message) => {
        console.log(message);
        let messageArray = messagesMap.get(message.themeId);
        let newMessage = new m.Message(uuidv4(), message.themeId, message.message, socket.id);
        messageArray.push(newMessage);
        messagesMap.set(message.themeId, messageArray);
        io.to(message.themeId).emit("messages", messagesMap.get(message.themeId));
    })

    socket.on("disconnect", () => {
        io.emit('disconnected', socket.id);
        console.log("client disconnected", socket.id);
        emitThemes();

    });
    socket.on("makeCall", (data) => {
        let calleeId = data.calleeId;
        let sdpOffer = data.sdpOffer;
        console.log('user', socket.user);
    
        socket.to(calleeId).emit("newCall", {
          callerId: socket.id,
          sdpOffer: sdpOffer,
        });
      });
    
    socket.on("answerCall", (data) => {
        let callerId = data.callerId;
        let sdpAnswer = data.sdpAnswer;
    
        socket.to(callerId).emit("callAnswered", {
          callee: socket.user,
          sdpAnswer: sdpAnswer,
        });
      });
    
    socket.on("IceCandidate", (data) => {
        let calleeId = data.calleeId;
        let iceCandidate = data.iceCandidate;
    
        socket.to(calleeId).emit("IceCandidate", {
          sender: socket.user,
          iceCandidate: iceCandidate,
        });
      });
});

io.listen(3001);