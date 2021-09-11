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
  /* sids 는 자동적으로 private room을 하나 가짐. 그래서 rooms의 key로 sids를 조회해서 없는 방은 public 방임
  rooms: Map(4) {
    '6zs9kAhX-4Upa1kKAAAF' => Set(1) { '6zs9kAhX-4Upa1kKAAAF' },
    'aeuHm91sdNI6lBZXAAAH' => Set(1) { 'aeuHm91sdNI6lBZXAAAH' },
    '4' => Set(1) { '6zs9kAhX-4Upa1kKAAAF' },
    'k' => Set(1) { 'aeuHm91sdNI6lBZXAAAH' }
  },
  sids: Map(2) {
    '6zs9kAhX-4Upa1kKAAAF' => Set(2) { '6zs9kAhX-4Upa1kKAAAF', '4' },
    'aeuHm91sdNI6lBZXAAAH' => Set(2) { 'aeuHm91sdNI6lBZXAAAH', 'k' }
  },
 */
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
    socket.to(roomName).emit("welcome", socket.nickname);
    done();
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname)
    );
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
