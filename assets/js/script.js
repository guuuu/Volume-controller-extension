chrome.storage.sync.set({last_tab: -1});
let global_tabs = [];
let str = null;
let id = 0;

let ac = new window.AudioContext();
let g = ac.createGain();

//chrome.storage.sync.set({slider_value: JSON.stringify([{tab: 6, value: 0.3}, {tab: 7, value: 0.8}, {tab: 8, value: 1}])});

document.getElementById("ch1").addEventListener("click", audio_tabs);
document.getElementById("ch2").addEventListener("click", audio_tabs);

chrome.windows.getAll({populate: true}).then(
    (data) => {
        data.forEach(arr => {
            arr.tabs.forEach(tab => {
                global_tabs.push({
                    icon: tab.favIconUrl,
                    title: tab.title,
                    audio: tab.audible,
                    muted: tab.mutedInfo.muted,
                    url: tab.url,
                    id: tab.id,
                    all: tab
                });
            })
        });

        chrome.storage.sync.get(["volumes"], (result) => {
            //console.log(JSON.parse(result.volumes));
            global_tabs.forEach(tab => {
                let el = create_element(tab.icon, tab.title, tab.audio, tab.muted, JSON.parse(result.volumes));
                document.getElementsByTagName("body")[0].append(el);
            });
        });

        //This """needs""" to be here so the margin bottom is applied to the last tab, there's prob a better fix...
        let fix_div = document.createElement("div");
        fix_div.append(".");
        fix_div.setAttribute("id", "fix");
        fix_div.setAttribute("class", "hide");
        document.getElementsByTagName("body")[0].append(fix_div);

        // chrome.storage.sync.get(["volumes"], (result) => {
        //     JSON.parse(result.volumes).forEach(volume => {
        //         console.log(volume);
        //     });
        //     //console.log(JSON.parse(result.volumes));
        // });
        
        },
        (data) => {
            console.log(data);
        }
);
            
function create_element(icon, title, audio, muted, volumes){
    //console.log(volumes);
    let row = document.createElement("div");
    let left= document.createElement("div");
    let mid = document.createElement("div");
    let right = document.createElement("div");
    let top = document.createElement("div");
    let bottom = document.createElement("div");
    let i = document.createElement("img");
    let a = document.createElement("img");
    let range = document.createElement("input");

    if(icon !== "" && icon !== undefined){
        i.setAttribute("src", icon);
        i.setAttribute("alt", title);
    }
    else{
        i.setAttribute("src", "assets/images/no_image.png");
        i.setAttribute("alt", "No image available");
    }

    top.append(title);
    top.setAttribute("class", "top");

    if(muted){
        a.setAttribute("src", "assets/images/muted.png");
        a.setAttribute("alt", "muted");
    }
    else
        if(audio){
            a.setAttribute("src", "assets/images/sound_playing.png");
            a.setAttribute("alt", "sound playing");
        }
        else{
            a.setAttribute("src", "assets/images/no_sound.png");
            a.setAttribute("alt", "no sound playing");
        }
    

    range.setAttribute("type", "range");
    range.setAttribute("min", "0");
    range.setAttribute("max", "1");
    range.setAttribute("value", "1");

    if(volumes !== undefined){
        if(volumes instanceof Array){
            volumes.forEach(volume => {
                console.log(global_tabs, volume.tab, id);
                if(global_tabs[id].id === volume.tab){
                    console.warn(global_tabs, volume.tab, id, parseFloat(volume.val));
                    range.setAttribute("value", volume.val)
                }
            });
        }
    }

    range.setAttribute("step", "0.01");
    range.setAttribute("class", "slider");
    range.addEventListener("change", changed);
    
    bottom.append(range);
    bottom.setAttribute("class", "bottom");

    right.append(a);
    right.setAttribute("class", "right");
    right.addEventListener("click", mute);
    right.setAttribute("id", id);
    left.setAttribute("id", id);
    range.setAttribute("id", id);
    id++;
    mid.append(top);
    mid.append(bottom);
    mid.setAttribute("class", "mid");
    left.append(i);
    left.setAttribute("class", "left");
    left.addEventListener("click", focus);
    row.append(left);
    row.append(mid);
    row.append(right);
    if(audio){
        row.setAttribute("class", "row");
    }
    else{
        row.setAttribute("class", "row hide");
    }

    if(id == global_tabs.length){
        row.style.marginBottom = "50px"
    }

    return row;
}

function mute(){
    let el = this;
    chrome.tabs.query({url: []}, function (tabs) {
        if (!tabs[el.id].mutedInfo.muted){
            chrome.tabs.update(tabs[el.id].id, {"muted": true});
            el.children[0].setAttribute("src", "assets/images/muted.png");
        }
        else{
            chrome.tabs.update(tabs[el.id].id, {"muted": false});
            if(tabs[el.id].audible)
                el.children[0].setAttribute("src", "assets/images/sound_playing.png");
            else
                el.children[0].setAttribute("src", "assets/images/no_sound.png");
        }
    });
}

function focus(){
    let el = this;
    chrome.tabs.query({url: []}, function(tabs) {
        chrome.tabs.update(tabs[el.id].id, {"active": true})
    });
}

/* Descobrir como colocar o audiocontext a tocar no background */
function changed(context){
    const opts = { audio: true, video: false };
    let gain = context.srcElement.value <= 1 || context.srcElement.value >= 0 ? context.srcElement.value : 1;

    try {
        let current_tab = -1;
        let last_tab = -1;
        let volumes_arr = [];


        //let ac = new window.AudioContext();
        //console.log(ac.destination);

        try {
            chrome.storage.sync.get(["volumes"], (result) => {
                JSON.parse(result.volumes).forEach(value => {
                    volumes_arr.push({
                        tab: value.tab,
                        val: value.val
                    });
                })
            });
            
            if(volumes_arr.length > 0){
                for (let i = 0; i < volumes_arr.length; i++) {
                    if (volumes_arr[i].tab === current_tab) {
                        volumes_arr[i].val = contex.srcElement.value;
                    }
                }
            }
            else{
                volumes_arr.push({
                    tab: global_tabs[context.srcElement.id].id,
                    val: gain
                })
            }

            chrome.storage.sync.set({volumes: JSON.stringify(volumes_arr)})
                
            
        } catch (error) {
            console.error(error);
        }
        
        chrome.tabs.query({active: true, currentWindow: true}, (r) => { current_tab = r[0].id; });

        chrome.storage.sync.get(["last_tab"], function(items){ 
            last_tab = items.last_tab;

            if(current_tab !== last_tab && current_tab !== -1){
                chrome.storage.sync.set({last_tab: current_tab});
                try {
                    chrome.tabCapture.capture(opts, (stream) => {
                        if(stream instanceof MediaStream){
                            //sendStreamToTab(global_tabs[context.srcElement.id].id, stream); 

                            let ss = ac.createMediaStreamSource(stream)
                            g.gain.value = gain;
                            ss.connect(g);
                            g.connect(ac.destination);
                        }
                        else{
                            chrome.storage.sync.set({last_tab: -1});
                            console.log("Janela nao focada");
                        }
                    });                    
                } catch (error) {
                    console.log(error);
                }
            }
            else{
                // chrome.tabs.sendMessage(global_tabs[context.srcElement.id].id, {
                //     action: 1,
                //     gain: gain,
                // }, (resp) => {
                //     console.log(resp);
                // });

                g.gain.value = gain;
            }
        });
    } catch (error) { console.error(error); }    
}

function audio_tabs(){
    if(this.id === "ch1" && this.children[0].classList.contains("hide")){
        this.children[0].classList.remove("hide");
        document.getElementById("ch2").children[0].className = "checkmark hide";

        let elements = document.getElementsByClassName("row");
        for(let i = 0; i < elements.length; i++){
            if(!global_tabs[elements[i].children[0].id].audio){
                elements[i].className = "row hide"
            }
        }

        document.getElementById("fix").className = "hide";
    }
    else if(this.id === "ch2" && this.children[0].classList.contains("hide")){
        this.children[0].classList.remove("hide");
        document.getElementById("ch1").children[0].className = "checkmark hide";

        let elements = document.getElementsByClassName("row");
        for(let i = 0; i < elements.length; i++){
            if(elements[i].classList.contains("hide")){
                elements[i].className = "row"
            }
        }

        document.getElementById("fix").classList.remove("hide");
    }
}

function sendStreamToTab(tabId, stream) {
    let pc = new webkitRTCPeerConnection({iceServers:[]});
    pc.addStream(stream);
    pc.createOffer((offer) => {
        pc.setLocalDescription(offer, () => {
            let port = chrome.tabs.connect(tabId, {name: 'tabCaptureSDP'});
            port.onMessage.addListener((sdp) => { pc.setRemoteDescription(new RTCSessionDescription(sdp)); });
            port.postMessage(pc.localDescription);
        });
    }, (error) => { console.error(error); });
}