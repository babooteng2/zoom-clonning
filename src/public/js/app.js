const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const peerFace = document.getElementById("peerFace");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerHTML = camera.label;
      if (currentCamera.label === camera.label) option.selected = true;
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstraint = {
    audio: true,
    video: { facingMode: "user " },
  };
  const cameraConstraint = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraint : initialConstraint
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  const tracks = myStream.getAudioTracks();
  tracks.forEach((track) => {
    track.enabled = !track.enabled;
  });

  if (!muted) {
    muteBtn.innerHTML = "Unmute";
  } else {
    muteBtn.innerHTML = "Mute";
  }
  muted = !muted;
}

function handleCameraClick() {
  const tracks = myStream.getVideoTracks();
  tracks.forEach((track) => {
    track.enabled = !track.enabled;
  });
  if (cameraOff) {
    cameraBtn.innerHTML = "Turn Camera Off";
  } else {
    cameraBtn.innerHTML = "Turn Camera On";
  }
  cameraOff = !cameraOff;
}

async function handleCameraChange() {
  const deviceId = camerasSelect.value;
  await getMedia(deviceId);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind == "video");
    videoSender.replaceTrack(videoTrack);
  }
}

// Welcome Form ( join a room )

const welcome = document.getElementById("welcome");
welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(e) {
  e.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

// RTC Code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: ["stun:stun4.l.google.com:19302"],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  console.log(
    "got an stream from my peer - peer's stream : ",
    data.streams[0],
    "my stream : ",
    myStream
  );
  peerFace.srcObject = data.streams[0];
}

function init() {
  call.hidden = true;
  muteBtn.addEventListener("click", handleMuteClick);
  cameraBtn.addEventListener("click", handleCameraClick);
  // camerasSelect.addEventListener("input", handleCameraChange);
  camerasSelect.addEventListener("click", handleCameraChange);
  welcomeForm.addEventListener("submit", handleWelcomeSubmit);
  socket.on("welcome", async () => {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", (e) => {
      console.log(e.data);
    });
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
  });
  socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (e) => {
      myDataChannel = e.channel;
      myDataChannel.addEventListener("message", (e) => {
        console.log(e.data);
      });
    });
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
  });
  socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
  });
  socket.on("ice", (ice) => {
    console.log("receive candidate");
    myPeerConnection.addIceCandidate(ice);
  });
}

init();
