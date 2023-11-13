import { Server } from "socket.io";
import theme from "./data/theme.js"
import { v4 as uuidv4 } from 'uuid';

const io = new Server({ cors: "https://localhost:3001"});

let themes = [];

io.on("connection", (socket) => {
    console.log("New connection", socket.id);

    socket.on("addNewTheme", (value) => {
        console.log("new theme", value);
        let title = value.title;
        themes.push(new theme.Theme(title, uuidv4()));
        socket.join(value.id);
        io.emit("themes", themes);
    });

    socket.on("deleteTheme", (id) => {
        const index = themes.indexOf(themes.find((e) => e.id === id));
        if(index > -1){
            themes.splice(index, 1);
            io.emit("themes", themes);
        }
        
    });

    socket.on("selectTheme", (id) => {
        socket.join(id);
        const index = themes.indexOf(themes.find((e) => e.id === id));
        themes.splice(index, 1);
        io.emit("themes", themes);
    })
});

io.listen(3001);