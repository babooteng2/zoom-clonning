import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

//kill -9 $(lsof -t -i tcp:3000) - 사용포트 서버 죽이기
// https://admin.socket.io/ 접속 localhost:3000/admin , 초기 path는 삭제 후 connect

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
});

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

wsServer.on("connection", (socket) => {
  //console.log(socket.id)
  // kind of middle ware
  socket["nickname"] = "Anonymouse";

  socket.onAny((event) => {
    //console.log(wsServer.sockets.adapter);
    console.log(`Socket Event : ${event}`);
  });

  socket.on("enter_room", (roomName, done) => {
    //console.log(socket.rooms);
    socket.join(roomName);
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    done(countRoom(roomName), socket["nickname"]);
    wsServer.sockets.emit("room_change", publicRooms());
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });

  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });

  socket.on("new_message", (msg, roomName, done) => {
    socket.to(roomName).emit("new_message", `${socket.nickname} : ${msg}`);
    done();
  });

  socket.on("nick_name", (nickname, done) => {
    if (nickname == "") {
      socket["nickname"] = "Anonymouse";
    } else {
      socket["nickname"] = nickname;
    }
    done();
  });

  socket.on("howManyRooms", (done) => {
    done(publicRooms());
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

httpServer.listen(3000, handleListen);
