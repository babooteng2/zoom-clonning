const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
  console.log("Connected to the Server ✔");
});

socket.addEventListener("message", (e) => {
  console.log(e);
  console.log(`${e.data} from the Server`);
});

socket.addEventListener("close", () => {
  console.log("Closed to Server ❌");
});

setTimeout(() => {
  socket.send("hello from the Browser");
}, 10000);
