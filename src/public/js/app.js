const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;

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
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
// camerasSelect.addEventListener("input", handleCameraChange);
camerasSelect.addEventListener("click", handleCameraChange);

// Welcome Form ( join a room )
const welcome = document.getElementById("welcome");
welcomeForm = welcome.querySelector("form");

function startMedia() {
  welcome.hidden = true;
  call.hidden = false;
  getMedia();
}

function handleWelcomeSubmit(e) {
  e.preventDefault();
  const input = welcomeForm.querySelector("input");
  console.log(input.value);
  socket.emit("join_room", input.value, startMedia);
  roomName = input.value;
  input.value = "";
}

function init() {
  call.hidden = true;
  welcomeForm.addEventListener("submit", handleWelcomeSubmit);
  socket.on("welcome", () => {
    console.log("someone joined");
  });
}

init();
