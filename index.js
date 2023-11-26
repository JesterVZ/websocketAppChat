import { Server } from "socket.io";
import theme from "./data/theme.js"
import { v4 as uuidv4 } from 'uuid';

const io = new Server({ cors: "https://localhost:3001"});

/// список тем
let themes = [];

/// мапа сообщений, где ключ - id темы, а значение - массив сообщений для нее
let messagesMap = new Map();

io.on("connection", (socket) => {
    console.log("New connection", socket.id);
    io.emit("themes", themes);

    socket.on("addNewTheme", (value) => {
        console.log("new theme", value);
        let title = value.title;
        let id = uuidv4();
        themes.push(new theme.Theme(title, id));
        socket.join(id);
        io.emit("themes", themes);
        io.emit("createdTheme", new theme.Theme(title, id));
        messagesMap.set(id, []);
    });

    socket.on("deleteTheme", (id) => {
        console.log(id);
        const index = themes.indexOf(themes.find((e) => e.id === id));
        if(index > -1){
            themes.splice(index, 1);
            io.emit("themes", themes);
            messagesMap.delete(id);
        }
        
    });

    socket.on("selectTheme", (id) => {
        socket.join(id);
        const index = themes.indexOf(themes.find((e) => e.id === id));
        themes.splice(index, 1);
        io.emit("themes", themes);
        io.emit('join', id);
    });

    socket.on("sendMessage", (message) => {
        console.log(message);
        let messageArray = messagesMap.get(message.themeId);
        messageArray.push(message.message);
        messagesMap.set(message.themeId, messageArray);
        socket.to(message.themeId).emit("messages", messagesMap.get(message.themeId));
    })

    socket.on("disconnect", () => {
        console.log(socket.id);
        /// Сделать удаление тем, паривязанных к определенному пользователю
    });
});

io.listen(3001);