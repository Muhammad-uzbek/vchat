import express from "express";
import { createServer } from "http";
import apiRouter from "./public/api/register.js";
const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);
//const io = require("socket.io")(server);
// write this import statement
import { Server } from "socket.io";
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  console.log("get request", req);
  res.sendFile(__dirname + "/public/index.html");
});

app.use("/api", apiRouter);

let connectedPeers = [];
let connectedPeersStrangers = [];

io.on("connection", (socket) => {
  connectedPeers.push(socket.id);
  socket.on("pre-offer", (data) => {
    const { calleePersonalCode, callType } = data;
    console.log(calleePersonalCode);
    console.log(connectedPeers);
    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === calleePersonalCode
    );

    console.log(connectedPeer);

    if (connectedPeer) {
      const data = {
        callerSocketId: socket.id,
        callType,
      };
      io.to(calleePersonalCode).emit("pre-offer", data);
    } else {
      const data = {
        preOfferAnswer: "CALLEE_NOT_FOUND",
      };
      io.to(socket.id).emit("pre-offer-answer", data);
    }
  });

  socket.on("pre-offer-answer", (data) => {
    const { callerSocketId, filter } = data;
    console.log("pre-offer-filter");
    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === callerSocketId
    );

    if (connectedPeer) {
      io.to(data.callerSocketId).emit("pre-offer-answer", data);
    }
  });

  socket.on("webRTC-signaling", (data) => {
    const { connectedUserSocketId } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      io.to(connectedUserSocketId).emit("webRTC-signaling", data);
    }
  });

  socket.on("user-hanged-up", (data) => {
    const { connectedUserSocketId } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      io.to(connectedUserSocketId).emit("user-hanged-up");
    }
  });

  socket.on("stranger-connection-status", (data) => {
    const { status } = data;
    if (status) {
      connectedPeersStrangers.push(socket.id);
    } else {
      const newConnectedPeersStrangers = connectedPeersStrangers.filter(
        (peerSocketId) => peerSocketId !== socket.id
      );
      connectedPeersStrangers = newConnectedPeersStrangers;
    }

    console.log(connectedPeersStrangers)
    // send length of connectedPeersStrangers to all connected peers
    io.emit("strangersamount", connectedPeersStrangers.length);
    console.log(connectedPeersStrangers.length);
  });

  socket.on("get-stranger-socket-id", () => {
    let randomStrangerSocketId;
    const filterConnectedPeersStrangers = connectedPeersStrangers.filter(
      (peerSocketId) => peerSocketId !== socket.id
    );

    if (filterConnectedPeersStrangers.length > 0) {
      randomStrangerSocketId = 
        filterConnectedPeersStrangers[
          Math.floor(Math.random() * filterConnectedPeersStrangers.length)
      ];
    } else {
      randomStrangerSocketId = null;
    }
    
    const data = {
      randomStrangerSocketId
    };

    io.to(socket.id).emit("stranger-socket-id", data);
  });

  socket.on("disconnect", () => {
    const newConnectedPeers = connectedPeers.filter(
      (peerSocketId) => peerSocketId !== socket.id
    );
    connectedPeers = newConnectedPeers;
    //console.log(connectedPeers);

    const newConnectedPeersStrangers = connectedPeersStrangers.filter(
      (peerSocketId) => peerSocketId !== socket.id
    );
    connectedPeersStrangers = newConnectedPeersStrangers;
  });
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
