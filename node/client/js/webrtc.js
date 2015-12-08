var ws = null;
var pc;
var pcConfig = {
    "iceServers": [{
            "url": "stun:stun.l.google.com:19302"
        },
        // Replace this IP with the host running the UV4L Server Address:
        {
            "url": "stun:192.168.1.2:3478"
        }
    ]
};
var pcOptions = {
    optional: [{
        DtlsSrtpKeyAgreement: true
    }]
};
var mediaConstraints = {
    optional: [],
    mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    }
};

RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
URL = window.webkitURL || window.URL;

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(pcConfig, pcOptions);
        pc.onicecandidate = onIceCandidate;
        pc.onaddstream = onRemoteStreamAdded;
        pc.onremovestream = onRemoteStreamRemoved;
        console.log("peer connection successfully created!");
    } catch (e) {
        console.log("createPeerConnection() failed");
    }
}

function onIceCandidate(event) {
    if (event.candidate) {
        var candidate = {
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        };
        var command = {
            command_id: "addicecandidate",
            data: JSON.stringify(candidate)
        };
        ws.send(JSON.stringify(command));
    } else {
        console.log("End of candidates.");
    }
}

function onRemoteStreamAdded(event) {
    console.log("Remote stream added:", URL.createObjectURL(event.stream));
    var remoteVideoElement = document.getElementById('remote-video');
    remoteVideoElement.src = URL.createObjectURL(event.stream);
    remoteVideoElement.play();
}

function onRemoteStreamRemoved(event) {
    var remoteVideoElement = document.getElementById('remote-video');
    remoteVideoElement.src = '';
}

window.onload = function() {
    if ("WebSocket" in window) {
        ws = new WebSocket('ws://192.168.1.2:8080/stream/webrtc');
        ws.onopen = function() {
            console.log("onopen()");
            createPeerConnection();
            var command = {
                command_id: "offer"
            };
            ws.send(JSON.stringify(command));
            console.log("onopen(), command=" + JSON.stringify(command));
        };

        ws.onmessage = function(evt) {
            var msg = JSON.parse(evt.data);
            //console.log("message=" + msg);
            console.log("type=" + msg.type);

            switch (msg.type) {
                case "offer":
                    pc.setRemoteDescription(new RTCSessionDescription(msg), function() {
                        pc.createAnswer(function(sessionDescription) {
                            pc.setLocalDescription(sessionDescription);
                            var command = {
                                command_id: "answer",
                                data: JSON.stringify(sessionDescription)
                            };
                            ws.send(JSON.stringify(command));
                            console.log(command);

                        }, function(error) {
                            console.log("Failed to setRemoteDescription");

                        }, mediaConstraints);
                    }, function onRemoteSdpError(event) {
                        alert('Failed to setRemoteDescription: ' + event);
                    });

                    var command = {
                        command_id: "geticecandidate"
                    };

                    console.log(command);
                    ws.send(JSON.stringify(command));
                    break;

                case "answer":
                    break;

                case "message":
                    alert(msg.data);
                    break;

                case "geticecandidate":
                    var candidates = JSON.parse(msg.data);
                    for (var i = 0; i < candidates.length; i++) {
                        var elt = candidates[i];
                        var candidate = new RTCIceCandidate({
                            sdpMLineIndex: elt.sdpMLineIndex,
                            candidate: elt.candidate
                        });
                        pc.addIceCandidate(candidate,
                            function() {
                                console.log("IceCandidate added: " + JSON.stringify(candidate));
                            },
                            function(error) {
                                console.log("addIceCandidate error: " + error);
                            }
                        );
                    }
                    break;
            }
        };

        ws.onclose = function(evt) {
            if (pc) {
                pc.close();
                pc = null;
            }
        };

        ws.onerror = function(evt) {
            alert("An error has occurred!");
            ws.close();
        };

    } else {
        alert("Sorry, this browser does not support WebSockets.");
    }
}

window.onbeforeunload = function() {
    if (ws) {
        ws.onclose = function() {}; // disable onclose handler first
        if (pc) {
            pc.close();
            pc = null;
        }
        if (ws) {
            ws.close();
            ws = null;
        }
    }
};
