import { Server } from "socket.io";

export const connectToServer = (server) => {

    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
        },
    });

    io.on("connection", (socket) => {

        console.log("User connected:", socket.id);

        let currentRoom = null;

        socket.on("join-room", (roomId) => {

            currentRoom = roomId;

            socket.join(roomId);

            socket.to(roomId).emit("user-joined", socket.id);

        });

        socket.on("disconnect", () => {

            console.log("User disconnected:", socket.id);

            if (currentRoom) {
                socket.to(currentRoom).emit("user-left", socket.id);
            }

        });

        socket.on("offer", ({ target, offer }) => {

            io.to(target).emit("offer", {
                sender: socket.id,
                offer,
            });

        });

        socket.on("answer", ({ target, answer }) => {

            io.to(target).emit("answer", {
                sender: socket.id,
                answer,
            });

        });

        socket.on("ice-candidate", ({ target, candidate }) => {

            io.to(target).emit("ice-candidate", {
                sender: socket.id,
                candidate,
            });

        });

    });

    return io;
};