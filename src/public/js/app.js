const socket = io();

const room_elm = document.getElementById("room");
const nickName_form = document.getElementById("nickName");
const roomName_form = document.getElementById("roomName");
const msg_form = document.getElementById("msg");
const open_rooms = document.getElementById("openRooms");

let roomName;

const toggleElmArr = [nickName_form, roomName_form, msg_form];

function ChangeHowManyInTheRoom(count) {
  const h3 = room_elm.querySelector("h3");
  h3.innerText = `Room ${roomName} (${count})`;
}

function addRoomList(rooms) {
  const ul = open_rooms.querySelector("ul");
  ul.innerHTML = "";
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerHTML = room;
    ul.append(li);
  });
}

function cb_enteringRoom(count, nick) {
  showMsgForm();
  ChangeHowManyInTheRoom(count);
  addMessage(`You just joined the room ${roomName}, ${nick} as nickname`);
}

function init() {
  showNickNameForm();
  socket.emit("howManyRooms", addRoomList);
}

function togglElmShow(elm) {
  toggleElmArr.forEach((target) => {
    if (target === elm) {
      target.hidden = false;
    } else {
      target.hidden = true;
    }
  });
}

function showNickNameForm() {
  togglElmShow(nickName_form);
}

function addMessage(msg) {
  const ul = room_elm.querySelector("ul");
  const li = document.createElement("li");
  li.innerHTML = msg;
  ul.append(li);
}

function showMsgForm() {
  togglElmShow(msg_form);
}

msg_form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = msg_form.querySelector("input");
  const { value } = input;
  socket.emit("new_message", value, roomName, () => {
    addMessage(`You : ${value}`);
  });
  input.value = "";
});

const changeNickBtn = msg_form.querySelector(".changeNickBtn");
changeNickBtn.addEventListener("click", () => {
  showNickNameForm();
});

function showRoomNameForm() {
  togglElmShow(roomName_form);
}

roomName_form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = roomName_form.querySelector("input");
  const { value } = input;
  const h3 = room_elm.querySelector("h3");
  h3.innerHTML = `Room ${value}`;
  roomName = value;
  socket.emit("enter_room", value, cb_enteringRoom);
});

nickName_form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = nickName_form.querySelector("input");
  const { value } = input;
  if (roomName == undefined) {
    socket.emit("nick_name", value, showRoomNameForm);
  } else {
    socket.emit("nick_name", value, showMsgForm);
  }
});

socket.on("welcome", (nickname, userCount) => {
  ChangeHowManyInTheRoom(userCount);
  addMessage(`${nickname} joined!`);
});

socket.on("bye", (nickname, userCount) => {
  ChangeHowManyInTheRoom(userCount);
  addMessage(`${nickname} left!`);
});

socket.on("new_message", addMessage);

socket.on("room_change", addRoomList);

init();
