import { useEffect, useRef, useState } from "react";
import "./MeetingRoom.css";
import socket from "./socket";

function MeetingRoom({ meetingCode }) {

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const screenStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const mediaReadyRef = useRef(null);
  const [participantLeft, setParticipantLeft] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  
useEffect(() => {

  const peerConnection = new RTCPeerConnection();

  peerConnectionRef.current = peerConnection;
  window.pc = peerConnection;

peerConnection.ontrack = (event) => {
  console.log("Remote track received:", event.track.kind);

  const remoteVideo = remoteVideoRef.current;

  if (!remoteVideo) {
    console.log("Remote video element missing");
    return;
  }

  let remoteStream = event.streams[0];

  // Handle tracks that arrive without an associated stream
  if (!remoteStream) {
    remoteStream = remoteVideo.srcObject || new MediaStream();
    remoteStream.addTrack(event.track);
  }

  remoteVideo.srcObject = remoteStream;

  remoteVideo.play()
    .then(() => {
      console.log("Remote video is playing");
    })
    .catch((error) => {
      console.error("Remote playback error:", error);
    });
};

  peerConnection.onicecandidate = (event) => {

    if (event.candidate) {

      console.log("🧊 ICE candidate found");

      socket.emit("ice-candidate", {
        target: remoteUserIdRef.current,
        candidate: event.candidate,
      });

    }

  };

  return () => {

    peerConnection.close();
    peerConnectionRef.current = null;

  };

}, []);


  // Start camera and microphone
useEffect(() => {
  let cancelled = false;

  mediaReadyRef.current = navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {

      // Ignore the result if this effect was already cleaned up
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const peerConnection = peerConnectionRef.current;

      if (!peerConnection) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        return null;
      }

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      return stream;
    })
    .catch((error) => {
      console.error("Error accessing camera/microphone:", error);
      return null;
    });

  return () => {
    cancelled = true;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };
}, []);


  // 2. Connect to Socket.IO and join the meeting room
  useEffect(() => {

    console.log("MeetingRoom loaded");
    console.log("Meeting code:", meetingCode);


    const joinRoom = () => {

      console.log(
        "Socket connected:",
        socket.id
      );

      socket.emit(
        "join-room",
        meetingCode
      );

      console.log(
        "📤 Join room sent:",
        meetingCode
      );

    };


    if (socket.connected) {

      joinRoom();

    } else {

      socket.on(
        "connect",
        joinRoom
      );

    }


    socket.on(
      "connect_error",
      (error) => {

        console.error(
          "Socket connection error:",
          error
        );

      }
    );


    return () => {

      socket.off(
        "connect",
        joinRoom
      );

      socket.off(
        "connect_error"
      );

    };

  }, [meetingCode]);


  // 3. Listen when another user joins
useEffect(() => {

  const handleUserJoined = async (userId) => {

    console.log(
      "👤 New user joined:",
      userId
    );

    remoteUserIdRef.current = userId;

    const peerConnection =
      peerConnectionRef.current;

    if (!peerConnection) {
      console.log("Peer connection not ready");
      return;
    }
    const stream = await mediaReadyRef.current;

     if (!stream) return;
    const offer =
      await peerConnection.createOffer();

    await peerConnection.setLocalDescription(
      offer
    );

    socket.emit("offer", {
      target: userId,
      offer: offer,
    });

    console.log("📤 Offer sent to:", userId);
  };

  socket.on(
    "user-joined",
    handleUserJoined
  );

  return () => {

    socket.off(
      "user-joined",
      handleUserJoined
    );

  };

}, []);

useEffect(() => {

  const handleOffer = async ({ sender, offer }) => {

    console.log("📥 Offer received from:", sender);

    remoteUserIdRef.current = sender;

    const peerConnection =
      peerConnectionRef.current;

    if (!peerConnection) {
      console.log("Peer connection not ready");
      return;
    }
    const stream = await mediaReadyRef.current;

if (!stream) return;

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    for (const candidate of pendingIceCandidatesRef.current) {
        await peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
    );
  }

pendingIceCandidatesRef.current = [];
    const answer =
      await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(
      answer
    );

    socket.emit("answer", {
      target: sender,
      answer: answer,
    });

    console.log("📤 Answer sent to:", sender);
  };

  socket.on(
    "offer",
    handleOffer
  );

  return () => {

    socket.off(
      "offer",
      handleOffer
    );

  };

}, []);

useEffect(() => {

  const handleAnswer = async ({ sender, answer }) => {

    console.log("📥 Answer received from:", sender);

    const peerConnection =
      peerConnectionRef.current;

    if (!peerConnection) {
      console.log("Peer connection not ready");
      return;
    }

     await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
     );

     for (const candidate of pendingIceCandidatesRef.current) {
      await peerConnection.addIceCandidate(
      new RTCIceCandidate(candidate)
     );
   }
   
   pendingIceCandidatesRef.current = [];

    console.log("Answer accepted");
  };

  socket.on(
    "answer",
    handleAnswer
  );

  return () => {

    socket.off(
      "answer",
      handleAnswer
    );

  };

}, []);


useEffect(() => {

  const handleIceCandidate = async ({ candidate }) => {

    console.log("📥 ICE candidate received");

    const peerConnection = peerConnectionRef.current;

    if (!peerConnection) {
      console.log("Peer connection not ready");
      return;
    }

    if (!peerConnection.remoteDescription) {
      console.log("Remote description not ready. Storing ICE candidate.");

      pendingIceCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );

      console.log("✅ ICE candidate added");

    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  socket.on("ice-candidate", handleIceCandidate);

  return () => {
    socket.off("ice-candidate", handleIceCandidate);
  };

}, []);

useEffect(() => {

  const handleUserLeft = (userId) => {

    if (remoteUserIdRef.current === userId) {

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      remoteUserIdRef.current = null;

      setParticipantLeft(true);
    }

  };

  socket.on("user-left", handleUserLeft);

  return () => {
    socket.off("user-left", handleUserLeft);
  };

}, []);


  // 4. Mute / Unmute
  const toggleMute = () => {

    const audioTrack =
      streamRef.current?.getAudioTracks()[0];

    if (audioTrack) {

      audioTrack.enabled =
        !audioTrack.enabled;

      setIsMuted(
        !audioTrack.enabled
      );

    }

  };


  // 5. Camera On / Off
  const toggleCamera = () => {

    const videoTrack =
      streamRef.current?.getVideoTracks()[0];

    if (videoTrack) {

      videoTrack.enabled =
        !videoTrack.enabled;

      setIsCameraOff(
        !videoTrack.enabled
      );

    }

  };

  // Screen Sharing
const toggleScreenShare = async () => {
  try {
    if (isScreenSharing) {
      const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
      if (screenTrack) {
       screenTrack.stop();
      }
  return;
}
    const screenStream =
      await navigator.mediaDevices.getDisplayMedia({
        video: true
      });

    const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) {
       return;
      }

    const peerConnection = peerConnectionRef.current;

    const videoSender = peerConnection
      ?.getSenders()
      .find(sender => sender.track?.kind === "video");
      console.log("Video sender:", videoSender);
      console.log("Current sender track:", videoSender?.track);

    if (!videoSender) {
      console.error("Video sender not found");
      screenTrack.stop();
      return;
    }

    // Save the original camera track
    cameraTrackRef.current =
      streamRef.current?.getVideoTracks()[0];
      

    // Replace camera video with screen video
    await videoSender.replaceTrack(screenTrack);
    console.log("Screen track successfully replaced!");

    // Show shared screen in your own video preview
    if (videoRef.current) {
      videoRef.current.srcObject = screenStream;
    }

    screenStreamRef.current = screenStream;
    setIsScreenSharing(true);
    // Restore camera when browser sharing is stopped
    screenTrack.onended = async () => {
      await videoSender.replaceTrack(cameraTrackRef.current);

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }

      screenStreamRef.current = null;
      cameraTrackRef.current = null;
      setIsScreenSharing(false);
    };

    } catch (error) {
      console.error("Error sharing screen:", error);
      setIsScreenSharing(false);
    }
};


  // 6. Leave meeting
  const leaveMeeting = () => {

    if (streamRef.current) {

      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

    }

    window.location.reload();

  };


return (
  <div className="meeting-container">

    <header className="meeting-header">
      <h1>Voxa</h1>
      <p>Meeting Code: {meetingCode}</p>
    </header>

    {participantLeft && (
      <p className="participant-left-message">
        The other participant has left the meeting.
      </p>
    )}

    <div className="video-grid">

      {/* Local participant */}
      <div className="video-card">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />

        <div className="participant-name">
          You
        </div>

      </div>

      {/* Remote participant */}
      <div className="video-card">

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
        />

        <div className="participant-name">
          Participant
        </div>

      </div>

    </div>

    
<div className="meeting-controls">

  <button
    className={`control-btn ${isMuted ? "active" : ""}`}
    onClick={toggleMute}
    title={isMuted ? "Unmute" : "Mute"}
  >
    <span className="control-icon">
      {isMuted ? "🎙️" : "🎤"}
    </span>
    <span>{isMuted ? "Unmute" : "Mute"}</span>
  </button>

  <button
    className={`control-btn ${isCameraOff ? "active" : ""}`}
    onClick={toggleCamera}
    title={isCameraOff ? "Turn camera on" : "Turn camera off"}
  >
    <span className="control-icon">
      {isCameraOff ? "📷" : "📹"}
    </span>
    <span>{isCameraOff ? "Camera On" : "Camera Off"}</span>
  </button>

<button
  className="control-btn"
  onClick={toggleScreenShare}
  title={isScreenSharing ? "Stop sharing" : "Share screen"}
>
  <span className="control-icon">🖥️</span>
  <span>
    {isScreenSharing ? "Stop Sharing" : "Share Screen"}
  </span>
</button>

  <button
    className="control-btn leave-button"
    onClick={leaveMeeting}
    title="Leave meeting"
  >
    <span className="control-icon">📞</span>
    <span>Leave</span>
  </button>

</div>


  </div>
);

}

export default MeetingRoom;