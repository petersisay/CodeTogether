import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  ArrowLeft,
  Users,
  Copy,
  Check,
  AlertCircle,
  Volume2,
  Share2,
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    ...(import.meta.env.VITE_TURN_SERVER
      ? [
          {
            urls: import.meta.env.VITE_TURN_SERVER,
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
        ]
      : []),
  ],
};

export default function MeetingRoom({
  meetingId,
  initialMode = 'video', // 'video' | 'audio'
  socket,
  currentUser,
  onReturnToWorkspace,
  onOpenAuth,
}) {
  const [localStream, setLocalStream] = useState(null);
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(initialMode === 'video');
  const [participants, setParticipants] = useState([]); // Array of remote participants
  const [connectionStates, setConnectionStates] = useState({}); // socketId -> 'connecting' | 'connected' | 'failed'
  const [remoteStreams, setRemoteStreams] = useState({}); // socketId -> MediaStream
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [speakingPeers, setSpeakingPeers] = useState({}); // socketId -> boolean
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);

  // 1. Call duration timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 2. Initialize Local Media Stream
  useEffect(() => {
    let streamInstance = null;

    async function initMedia() {
      try {
        setErrorMsg('');
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video:
            initialMode === 'video'
              ? {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: 'user',
                }
              : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamInstance = stream;
        setLocalStream(stream);

        if (localVideoRef.current && initialMode === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        // Setup Web Audio Analyser for Speaking Indicator
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const audioCtx = new AudioCtx();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;

            const checkAudio = () => {
              if (!analyserRef.current) return;
              const data = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(data);
              let sum = 0;
              for (let i = 0; i < data.length; i++) {
                sum += data[i];
              }
              const average = sum / data.length;
              const speaking = average > 18; // Speaking threshold
              setIsSpeakingLocal(speaking);

              if (socket && socket.connected) {
                socket.emit('webrtc:media-toggle', {
                  meetingId,
                  micActive: stream.getAudioTracks().some((t) => t.enabled),
                  cameraActive: stream.getVideoTracks().some((t) => t.enabled),
                  isSpeaking: speaking,
                });
              }

              animFrameRef.current = requestAnimationFrame(checkAudio);
            };

            animFrameRef.current = requestAnimationFrame(checkAudio);
          }
        } catch (e) {
          console.warn('[AudioContext] Could not start audio analyzer:', e);
        }
      } catch (err) {
        console.error('[MediaDevices Error]:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMsg(
            'Microphone/Camera permission denied. Please enable device permissions in your browser address bar to join the meeting.'
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMsg(
            'No microphone or camera device found. You can still participate in text chat.'
          );
        } else {
          setErrorMsg(`Device Error: ${err.message}`);
        }
      }
    }

    initMedia();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const audioCtx = audioContextRef.current;
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [meetingId, initialMode, socket]);

  // 3. WebRTC Peer Connection Helper
  const createPeerConnection = (targetSocketId, stream) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(targetSocketId, pc);

    setConnectionStates((prev) => ({ ...prev, [targetSocketId]: 'connecting' }));

    // Add local tracks to peer connection
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && socket.connected) {
        socket.emit('webrtc:ice-candidate', {
          meetingId,
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Receive Remote Track
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: remoteStream,
      }));
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      setConnectionStates((prev) => ({
        ...prev,
        [targetSocketId]: pc.connectionState,
      }));
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        setConnectionStates((prev) => ({
          ...prev,
          [targetSocketId]: 'failed',
        }));
      }
    };

    return pc;
  };

  // 4. Socket Signaling Listeners
  useEffect(() => {
    if (!socket || !localStream) return;

    // Join the meeting on socket
    socket.emit('meeting:join', {
      meetingId,
      mediaType: initialMode === 'video' ? 'audio-video' : 'audio-only',
    });

    // Existing participants list received upon joining
    const handleParticipants = async ({ participants: existingList }) => {
      const otherParticipants = existingList.filter((p) => p.socketId !== socket.id);
      setParticipants(otherParticipants);

      // As the new joiner, initiate offer to each existing participant
      for (const peer of otherParticipants) {
        try {
          const pc = createPeerConnection(peer.socketId, localStream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('webrtc:offer', {
            meetingId,
            targetSocketId: peer.socketId,
            offer,
          });
        } catch (e) {
          console.error('[WebRTC Offer Error]:', e);
        }
      }
    };

    // New participant joined meeting
    const handleUserJoined = (newPeer) => {
      if (newPeer.socketId === socket.id) return;
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === newPeer.socketId)) return prev;
        return [...prev, newPeer];
      });
      // The incoming peer will send an offer to us
    };

    // Participant left meeting
    const handleUserLeft = ({ socketId }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      if (peerConnectionsRef.current.has(socketId)) {
        peerConnectionsRef.current.get(socketId).close();
        peerConnectionsRef.current.delete(socketId);
      }
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });
      setConnectionStates((prev) => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });
      setSpeakingPeers((prev) => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });
    };

    // Incoming WebRTC Offer
    const handleOffer = async ({ fromSocketId, offer }) => {
      try {
        const pc = createPeerConnection(fromSocketId, localStream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc:answer', {
          meetingId,
          targetSocketId: fromSocketId,
          answer,
        });
      } catch (e) {
        console.error('[WebRTC Answer Error]:', e);
      }
    };

    // Incoming WebRTC Answer
    const handleAnswer = async ({ fromSocketId, answer }) => {
      try {
        const pc = peerConnectionsRef.current.get(fromSocketId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (e) {
        console.error('[WebRTC SetRemote Error]:', e);
      }
    };

    // Incoming ICE Candidate
    const handleIceCandidate = async ({ fromSocketId, candidate }) => {
      try {
        const pc = peerConnectionsRef.current.get(fromSocketId);
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.error('[WebRTC Candidate Error]:', e);
      }
    };

    // Peer media toggle (mic, camera, speaking)
    const handleMediaToggle = ({ socketId, micActive: peerMic, cameraActive: peerCam, isSpeaking: peerSpeaking }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === socketId
            ? { ...p, micActive: peerMic ?? p.micActive, cameraActive: peerCam ?? p.cameraActive }
            : p
        )
      );
      if (typeof peerSpeaking === 'boolean') {
        setSpeakingPeers((prev) => ({ ...prev, [socketId]: peerSpeaking }));
      }
    };

    socket.on('meeting:participants', handleParticipants);
    socket.on('meeting:user-joined', handleUserJoined);
    socket.on('meeting:user-left', handleUserLeft);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('webrtc:media-toggle', handleMediaToggle);

    return () => {
      socket.emit('meeting:leave', { meetingId });
      socket.off('meeting:participants', handleParticipants);
      socket.off('meeting:user-joined', handleUserJoined);
      socket.off('meeting:user-left', handleUserLeft);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('webrtc:media-toggle', handleMediaToggle);

      // Close all peer connections
      const pcs = peerConnectionsRef.current;
      pcs.forEach((pc) => pc.close());
      pcs.clear();
    };
  }, [socket, localStream, meetingId, initialMode]);

  // 5. Toggle Microphone
  const toggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicActive(audioTrack.enabled);

      if (socket && socket.connected) {
        socket.emit('webrtc:media-toggle', {
          meetingId,
          micActive: audioTrack.enabled,
          cameraActive,
          isSpeaking: false,
        });
      }
    }
  };

  // 6. Toggle Camera
  const toggleCamera = async () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraActive(videoTrack.enabled);

      if (socket && socket.connected) {
        socket.emit('webrtc:media-toggle', {
          meetingId,
          micActive,
          cameraActive: videoTrack.enabled,
        });
      }
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });
        const newTrack = videoStream.getVideoTracks()[0];
        localStream.addTrack(newTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        peerConnectionsRef.current.forEach((pc) => {
          pc.addTrack(newTrack, localStream);
        });

        setCameraActive(true);

        if (socket && socket.connected) {
          socket.emit('webrtc:media-toggle', {
            meetingId,
            micActive,
            cameraActive: true,
          });
        }
      } catch (err) {
        console.warn('Could not add camera track:', err);
      }
    }
  };

  // 7. Copy Meeting Link
  const copyMeetingLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* 1. TOP HEADER */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between px-4 py-3 rounded-2xl bg-[#091124] border border-blue-900/40 shadow-[0_0_30px_rgba(14,35,80,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToWorkspace}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-800/40 hover:bg-blue-900/50 text-xs font-medium text-sky-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Workspace</span>
          </button>

          <div className="h-5 w-[1px] bg-blue-900/50 hidden sm:block"></div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{meetingId}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-900/40 text-[10px] text-sky-400 border border-blue-700/40 font-mono">
                {initialMode === 'video' ? 'Video Meeting' : 'Voice Room'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{formatDuration(callDuration)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-sky-400" />
                <span>{participants.length + 1} participant{participants.length + 1 > 1 ? 's' : ''}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyMeetingLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1630] border border-blue-700/40 hover:border-blue-500/50 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share Link'}</span>
          </button>

          <button
            onClick={onOpenAuth}
            className="px-2.5 py-1.5 rounded-xl bg-blue-950/70 border border-blue-700/40 text-xs text-sky-300 hover:text-white hover:bg-blue-900/50 transition-colors cursor-pointer"
          >
            {currentUser ? currentUser.username : 'Sign In'}
          </button>
        </div>
      </div>

      {/* 2. ERROR / PERMISSION BANNER */}
      {errorMsg && (
        <div className="w-full max-w-6xl mx-auto mt-3 p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-2.5 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="flex-1">{errorMsg}</p>
        </div>
      )}

      {/* 3. MAIN VIDEO / PARTICIPANTS GRID */}
      <div className="w-full max-w-6xl mx-auto flex-1 my-4 flex items-center justify-center">
        <div
          className={`w-full grid gap-4 ${
            participants.length === 0
              ? 'grid-cols-1 max-w-xl'
              : participants.length === 1
              ? 'grid-cols-1 md:grid-cols-2 max-w-4xl'
              : participants.length <= 3
              ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl'
              : 'grid-cols-2 lg:grid-cols-3 max-w-5xl'
          }`}
        >
          {/* LOCAL USER TILE */}
          <div
            className={`relative rounded-2xl bg-[#091124] border overflow-hidden flex flex-col items-center justify-center min-h-[240px] sm:min-h-[280px] shadow-[0_0_30px_rgba(14,35,80,0.3)] transition-all ${
              isSpeakingLocal
                ? 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                : 'border-blue-900/40'
            }`}
          >
            {cameraActive ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="relative">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Self"
                      className={`w-20 h-20 rounded-full object-cover ring-2 transition-all ${
                        isSpeakingLocal ? 'ring-emerald-400 scale-105' : 'ring-blue-500/40'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 text-white font-bold text-2xl flex items-center justify-center ring-2 transition-all ${
                        isSpeakingLocal ? 'ring-emerald-400 scale-105' : 'ring-blue-500/40'
                      }`}
                    >
                      {(currentUser?.username || 'Y').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isSpeakingLocal && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-[#091124] animate-pulse"></span>
                  )}
                </div>
                <h4 className="mt-3 text-sm font-semibold text-slate-100">
                  {currentUser?.username || 'You (Host)'}
                </h4>
                <p className="text-[11px] text-slate-400">Audio only</p>
              </div>
            )}

            {/* Bottom status badge */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs">
              <span className="font-medium text-slate-200">
                {currentUser?.username || 'You'} (You)
              </span>
              <div className="flex items-center gap-2">
                {!micActive && (
                  <span className="p-1 rounded bg-red-600/80 text-white" title="Muted">
                    <MicOff className="w-3 h-3" />
                  </span>
                )}
                {isSpeakingLocal && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>Speaking</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* REMOTE PARTICIPANTS TILES */}
          {participants.map((peer) => {
            const stream = remoteStreams[peer.socketId];
            const isPeerSpeaking = speakingPeers[peer.socketId];
            const state = connectionStates[peer.socketId] || 'connecting';

            return (
              <RemoteParticipantTile
                key={peer.socketId}
                peer={peer}
                stream={stream}
                isSpeaking={isPeerSpeaking}
                connectionState={state}
              />
            );
          })}
        </div>
      </div>

      {/* 4. FLOATING CONTROL BAR */}
      <div className="w-full max-w-md mx-auto mb-2 flex items-center justify-center gap-3 px-5 py-3 rounded-full bg-[#091228]/95 border border-blue-800/50 shadow-[0_0_40px_rgba(14,35,80,0.5)] backdrop-blur-lg">
        {/* Microphone Toggle */}
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full transition-all cursor-pointer ${
            micActive
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
          }`}
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full transition-all cursor-pointer ${
            cameraActive
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
          title={cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {cameraActive ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        {/* Share Link */}
        <button
          onClick={copyMeetingLink}
          className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Share Meeting Link"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* End / Leave Meeting */}
        <button
          onClick={onReturnToWorkspace}
          className="px-5 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all cursor-pointer"
          title="Leave Meeting"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave Call</span>
        </button>
      </div>
    </div>
  );
}

// Remote Participant Subcomponent
function RemoteParticipantTile({ peer, stream, isSpeaking, connectionState }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideoTrack = stream && stream.getVideoTracks().some((t) => t.enabled);

  return (
    <div
      className={`relative rounded-2xl bg-[#091124] border overflow-hidden flex flex-col items-center justify-center min-h-[240px] sm:min-h-[280px] shadow-[0_0_30px_rgba(14,35,80,0.3)] transition-all ${
        isSpeaking
          ? 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
          : 'border-blue-900/40'
      }`}
    >
      {hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="relative">
            {peer.avatar ? (
              <img
                src={peer.avatar}
                alt={peer.username}
                className={`w-20 h-20 rounded-full object-cover ring-2 transition-all ${
                  isSpeaking ? 'ring-emerald-400 scale-105' : 'ring-blue-500/40'
                }`}
              />
            ) : (
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 text-white font-bold text-2xl flex items-center justify-center ring-2 transition-all ${
                  isSpeaking ? 'ring-emerald-400 scale-105' : 'ring-blue-500/40'
                }`}
              >
                {(peer.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-[#091124] animate-pulse"></span>
            )}
          </div>
          <h4 className="mt-3 text-sm font-semibold text-slate-100">{peer.username}</h4>
          <p className="text-[11px] text-slate-400 capitalize">{peer.mediaType || 'Voice & Video'}</p>
        </div>
      )}

      {/* Hidden audio element to ensure remote audio playback */}
      {stream && <audio autoPlay ref={(el) => el && (el.srcObject = stream)} />}

      {/* Bottom status badge */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs">
        <span className="font-medium text-slate-200">{peer.username}</span>
        <div className="flex items-center gap-2">
          {connectionState === 'connecting' && (
            <span className="text-[10px] text-amber-400">Connecting...</span>
          )}
          {connectionState === 'failed' && (
            <span className="text-[10px] text-red-400">Connection Failed</span>
          )}
          {!peer.micActive && (
            <span className="p-1 rounded bg-red-600/80 text-white" title="Muted">
              <MicOff className="w-3 h-3" />
            </span>
          )}
          {isSpeaking && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <Volume2 className="w-3 h-3 animate-pulse" />
              <span>Speaking</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
