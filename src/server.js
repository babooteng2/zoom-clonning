import http from "http";
import SocketIO from "socket.io";
import express from "express";

//kill -9 $(lsof -t -i tcp:3000) - 사용포트 서버 죽이기

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const server = http.createServer(app);
const wsServer = SocketIO(server);

wsServer.on("connection", (socket) => {
  //console.log(socket.id)
  // kind of middle ware
  socket.onAny((event) => {
    console.log(`Socket Event : ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    //console.log(socket.rooms);
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
    done();
  });
  ``;
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => socket.to(room).emit("bye"));
  });
  socket.on("new_message", (msg, roomName, done) => {
    socket.to(roomName).emit("new_message", msg);
    done();
  });
});

/* const wss = new WebSocket.Server({ server });
const sockets = [];
wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "anonymouse";
  console.log("Connected to the Browser ✔");
  socket.on("close", () => console.log("Disconnected from the Browser ❌"));
  socket.on("message", (message) => {
    //console.log(message.toString("utf-8"));
    const msg = JSON.parse(message);
    switch (msg.type) {
      case "message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${msg.payload}`)
        );
        break;
      case "nickname":
        socket["nickname"] = msg.payload;
        break;
    }
  });
}); */

server.listen(3000, handleListen);
