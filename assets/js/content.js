console.log("Carregado content script");
let a = document.createElement("audio");
a.setAttribute("id", "chrm-ext-audio-aux-tag");
document.querySelector("body").append(a);

let ac = new window.AudioContext();
let g = ac.createGain();

chrome.runtime.onMessage.addListener((m, s, sr) => {
    if(m.action === 1){
        try {
            g.gain.value = m.gain;
            sr({status: "success", error: null });
        } catch (error) {
            console.error(error);
            sr({ status: "error", error: error });
        }
    }

    return true;
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'tabCaptureSDP') {
        port.onMessage.addListener((remoteDescription) => { onReceiveOfferSDP(remoteDescription, (sdp) => { port.postMessage(sdp); }); });
    }
});

function onReceiveOfferSDP(sdp, sendResponse) {
    var pc = new webkitRTCPeerConnection({iceServers:[]});

    pc.onaddstream = (event) => {
        // let ss = ac.createMediaStreamSource(event.stream)
        // g.gain.value = 0.5;
        // ss.connect(g);
        // g.connect(ac.destination);
        
        console.log(ac.destination);
        console.log(g);
        console.log(ss);
        console.log(chrome.tabCapture);
        //document.querySelector("#chrm-ext-audio-aux-tag").srcObject = event.stream;

    };

    pc.setRemoteDescription(new RTCSessionDescription(sdp), () => {
        pc.createAnswer((answer) => {
            pc.setLocalDescription(answer);
            sendResponse(pc.localDescription);
        });
    });
}