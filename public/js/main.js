import * as store from "./store.js";
import * as wss from "./wss.js";
import * as webRTCHandler from "./webRTCHandler.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";
import * as recordingUtils from "./recordingUtils.js";
import * as strangerUtils from "./strangerUtils.js";
import * as elements from "./elements.js";

// initialization of socketIO connection
const socket = io("/");
wss.registerSocketEvents(socket);

webRTCHandler.getLocalPreview();

//register event listener for personal code copy button
const personalCodeCopyButton = document.getElementById(
  "personal_code_copy_button"
);
personalCodeCopyButton.addEventListener("click", () => {
  const personalCode = store.getState().socketId;
  navigator.clipboard && navigator.clipboard.writeText(personalCode);
});

// register event listeners for connection buttons

const personalCodeChatButton = document.getElementById(
  "personal_code_chat_button"
);

const personalCodeVideoButton = document.getElementById(
  "personal_code_video_button"
);

personalCodeChatButton.addEventListener("click", () => {
  console.log("chat button clicked");

  const calleePersonalCode = document.getElementById(
    "personal_code_input"
  ).value;
  const callType = constants.callType.CHAT_PERSONAL_CODE;

  webRTCHandler.sendPreOffer(callType, calleePersonalCode);
});

personalCodeVideoButton.addEventListener("click", () => {
  console.log("video button clicked");

  const calleePersonalCode = document.getElementById(
    "personal_code_input"
  ).value;
  const callType = constants.callType.VIDEO_PERSONAL_CODE;

  webRTCHandler.sendPreOffer(callType, calleePersonalCode);
});

// const strangerChatButton = document.getElementById("stranger_chat_button");
// strangerChatButton.addEventListener("click", () => {
//   // logic
//   strangerUtils.getStrangerSocketIdAndConnect(constants.callType.CHAT_STRANGER);
// });

const strangerVideoButton = document.getElementById("stranger_video_button");
strangerVideoButton.addEventListener("click", () => {
  //logic
  strangerUtils.getStrangerSocketIdAndConnect(constants.callType.VIDEO_STRANGER);
});

// write  function that works when peer connection is ended, this function connects to other peer
// const peerConnectionEnded = () => {
//   const callType = store.getState().callType;
//   if (callType === constants.callType.VIDEO_STRANGER) {
//     strangerUtils.getStrangerSocketIdAndConnect(callType);
//   }
// };


// make it allow to connect from strangers by default
strangerUtils.changeStrangerConnectionStatus(true);

// register event for allow connections from strangers
const checkbox = document.getElementById("allow_strangers_checkbox");
checkbox.addEventListener("click", () => {
  const checkboxState = store.getState().allowConnectionsFromStrangers;
  ui.updateStrangerCheckbox(!checkboxState);
  store.setAllowConnectionsFromStrangers(!checkboxState);
  strangerUtils.changeStrangerConnectionStatus(!checkboxState);
});
// a function that gets stranger socket id and saves it in the store as an array
const saveSocketId = (data) => {
  store.setStrangerSocketId(store.getState().strangerSocketId.push(data));

};

// event listeners for video call buttons

const micButton = document.getElementById("mic_button");
micButton.addEventListener("click", () => {
  const localStream = store.getState().localStream;
  const micEnabled = localStream.getAudioTracks()[0].enabled;
  localStream.getAudioTracks()[0].enabled = !micEnabled;
  ui.updateMicButton(micEnabled);
});

const cameraButton = document.getElementById("camera_button");
cameraButton.addEventListener("click", () => {
  const localStream = store.getState().localStream;
  const cameraEnabled = localStream.getVideoTracks()[0].enabled;
  localStream.getVideoTracks()[0].enabled = !cameraEnabled;
  ui.updateCameraButton(cameraEnabled);
});

// const switchForScreenSharingButton = document.getElementById(
//   "screen_sharing_button"
// );
// switchForScreenSharingButton.addEventListener("click", () => {
//   const screenSharingActive = store.getState().screenSharingActive;
//   webRTCHandler.switchBetweenCameraAndScreenSharing(screenSharingActive);
// });

// messenger

const newMessageInput = document.getElementById("new_message_input");
newMessageInput.addEventListener("keydown", (event) => {
  console.log("change occured");
  const key = event.key;

  if (key === "Enter") {
    webRTCHandler.sendMessageUsingDataChannel(event.target.value);
    ui.appendMessage(event.target.value, true);
    newMessageInput.value = "";
  }
});

const sendMessageButton = document.getElementById("send_message_button");
sendMessageButton.addEventListener("click", () =>{
  console.log("send message button clicked");
  const message = newMessageInput.value;
  console.log(message);
  // if(!message) return;
  webRTCHandler.sendMessageUsingDataChannel(message);
  ui.appendMessage(message, true);
  newMessageInput.value = "";
});

const startRecordingButton = document.getElementById("start_recording_button");
startRecordingButton.addEventListener("click", () => {
  recordingUtils.startRecording();
  ui.showRecordingPanel();
});

const stopRecordingButton = document.getElementById("stop_recording_button");
stopRecordingButton.addEventListener("click", () => {
  recordingUtils.stopRecording();
  ui.resetRecordingButtons();
});

const pauseRecordingButton = document.getElementById("pause_recording_button");
pauseRecordingButton.addEventListener("click", () => {
  recordingUtils.pauseRecording();
  ui.switchRecordingButton(true);
});

const resumRecordingButton = document.getElementById("resume_recording_button");
resumRecordingButton.addEventListener("click", () => {
  recordingUtils.resumeRecording();
  ui.switchRecordingButton();
});

// hang up

const hangUpButton = document.getElementById("hang_up_button");
hangUpButton.addEventListener("click", () => {
  webRTCHandler.handleHangUp();
});
const nextButton = document.getElementById("next_button");
nextButton.addEventListener("click", next);

function next(){
  if(localStorage.getItem("strangersamount") < 3){
    const infoDialog = elements.getInfoDialog(
      "Tarmoqda boshqa suhbatdosh yo'q", 
      "Keyinroq urunib ko'ring."
    );
  
    if (infoDialog) {
      const dialog = document.getElementById("dialog");
      dialog.appendChild(infoDialog);
      setTimeout(() => {
        const dialog = document.getElementById("dialog");
        dialog.querySelectorAll("*").forEach((dialog) => dialog.remove());
      }, [1500]);
    }
  }
  else{
    webRTCHandler.handleHangUp();
    strangerUtils.getStrangerSocketIdAndConnect(constants.callType.VIDEO_STRANGER);
  }
}
// work next function when click on next key in keyboard
document.addEventListener("keydown", (event) => {
  const key = event.key;
  if (key === "ArrowRight") {
    next();
  }
});

const hangUpChatButton = document.getElementById("finish_chat_call_button");
hangUpChatButton.addEventListener("click", () => {
  webRTCHandler.handleHangUp();
});

// filters

const filters = document.getElementsByClassName("filter-el");
// console log the id of the filter that was clicked
for (let i = 0; i < filters.length; i++) {
  filters[i].addEventListener("click", () => {
    console.log(filters[i].id);
    ui.updateFilter(filters[i].id);
    // send filter id to the other peer
    webRTCHandler.sendFilter(filters[i].id);
    // apply border to the filter that was clicked
    // remove border from the other filters
    for (let i = 0; i < filters.length; i++) {
      document.getElementById(filters[i].id).style.border = "none";
    }
    document.getElementById(filters[i].id).style.border = "2px solid #007AFF";
  });
}