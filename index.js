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
        console.log("new theme", value);

        let title = value.title;
        let id = uuidv4();
        let newTheme = new Theme(title, id);

        themesList.push(newTheme)

        socket.join(id);
        emitThemes();
        io.emit("createdTheme", newTheme);
        messagesMap.set(id, []);
    });

    socket.on("deleteTheme", (id) => {
        console.log(id);
        
        themesMap.delete(socket.id);
        emitThemes();
        messagesMap.delete(id);
    });

    socket.on('leave', (room) => {
        console.log('leave from room');
        io.to(room).emit('disconnected', socket.id);
    });

    socket.on("selectTheme", (roomId) => {
        socket.join(roomId);
        const index = themesList.indexOf(themesList.find((e) => e.id === roomId));
        themesList.splice(index, 1);
        emitThemes();
        io.to(roomId).emit('join', roomId);
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
});

io.listen(3001);