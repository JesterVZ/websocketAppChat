import { Server } from "socket.io";
import { Theme } from "../data/theme.js";
import { Message } from "../data/message.js";
import { v4 as uuidv4 } from 'uuid';
class ChatServer {
    constructor() {
        this.io = new Server({ cors: "https://localhost:3001" });
        this.themesList = [];
        this.messagesMap = new Map();

        this.io.on("connection", (socket) => {
            console.log("New connection", socket.id);
            socket.send(socket.id);
            this.emitThemes();

            socket.on("addNewTheme", (value) => {
                this.addNewTheme(socket, value);
            });

            socket.on('leave', (room) => {
                this.leaveRoom(socket, room);
            });

            socket.on("selectTheme", (roomId) => {
                this.selectTheme(socket, roomId);
            });

            socket.on("sendMessage", (message) => {
                this.sendMessage(socket, message);
            });

            socket.on("disconnect", () => {
                this.disconnect(socket);
            });

            socket.on("makeCall", (data) => {
                this.makeCall(socket, data);
            });

            socket.on("answerCall", (data) => {
                this.answerCall(socket, data);
            });

            socket.on("leaveCall", (data) => {
                this.leaveCall(socket, data);
            });

            socket.on("cancelCall", (data) => {
                this.cancelCall(socket, data);
            });

            socket.on("IceCandidate", (data) => {
                this.sendIceCandidate(socket, data);
            });
        });

        this.io.listen(3001);
    }

    emitThemes() {
        this.io.emit("themes", this.themesList);
    }

    addNewTheme(socket, value) {
        let title = value.title;
        let id = uuidv4();
        let isCanRing = value.isCanRing;
        let userId = socket.id;
        let newTheme = new Theme(title, id, isCanRing, userId);

        console.log("new theme", newTheme);

        this.themesList.push(newTheme);

        socket.join(id);
        this.emitThemes();
        this.io.emit("createdTheme", newTheme);
        this.messagesMap.set(id, []);
    }

    leaveRoom(socket, room) {
        console.log('leave from room', room.id);
        const index = this.themesList.findIndex((e) => e.id === room.id);
        if (index !== -1) {
            this.themesList.splice(index, 1);
        }
        this.emitThemes();
        this.messagesMap.delete(room.id);
        this.io.to(room).emit('disconnected', socket.id);
        socket.leave(room);
    }

    selectTheme(socket, roomId) {
        socket.join(roomId);
        const index = this.themesList.findIndex((e) => e.id === roomId);
        const creatorId = this.themesList[index].userId;
        this.themesList.splice(index, 1);
        this.emitThemes();
        this.io.to(roomId).emit('join', roomId);
        this.io.to(roomId).emit('creatorId', creatorId);
        this.io.to(roomId).emit('interlocoutorId', socket.id);
        console.log('creatorId', creatorId);
        console.log('interlocoutorId', socket.id);
    }

    sendMessage(socket, message) {
        console.log(message);
        let messageArray = this.messagesMap.get(message.themeId);
        let newMessage = new Message(uuidv4(), message.themeId, message.message, socket.id);
        messageArray.push(newMessage);
        this.messagesMap.set(message.themeId, messageArray);
        this.io.to(message.themeId).emit("messages", this.messagesMap.get(message.themeId));
    }

    disconnect(socket) {
        this.io.emit('disconnected', socket.id);
        console.log("client disconnected", socket.id);
        const room = this.themesList.find((e) => e.userId == socket.id);
        this.leaveRoom(socket, room);
        this.emitThemes();
    }

    makeCall(socket, data) {
        let calleeId = data.calleeId;
        let sdpOffer = data.sdpOffer;

        socket.to(calleeId).emit("newCall", {
            callerId: socket.id,
            sdpOffer: sdpOffer,
        });
    }

    answerCall(socket, data) {
        let callerId = data.callerId;

let sdpAnswer = data.sdpAnswer;

        socket.to(callerId).emit("callAnswered", {
            callee: socket.user,
            sdpAnswer: sdpAnswer,
        });
    }

    leaveCall(socket, data) {
        let calleeId = data.calleeId;
        socket.to(calleeId).emit("callEnd", {
            callee: socket.user,
        });
    }

    cancelCall(socket, data) {
        let calleeId = data.calleeId;
        socket.to(calleeId).emit("callCanceled", {
            callee: socket.user,
        });
    }

    sendIceCandidate(socket, data) {
        let calleeId = data.calleeId;
        let iceCandidate = data.iceCandidate;

        socket.to(calleeId).emit("IceCandidate", {
            sender: socket.user,
            iceCandidate: iceCandidate,
        });
    }
}

export {ChatServer};
