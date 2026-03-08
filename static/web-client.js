import { start, togglePause } from "./clock.js";

// add CDN for socket.io and link to this file in index.html header


// Variables
const serverURL = "https://play-together-clock.onrender.com";  // make sure you EDIT THIS!
                                                               // use http://localhost:3000
                                                               // if running server locally
let socketID = "";
let randomR, randomG, randomB;

// Client Initialization
const socket = io(serverURL);

// keep the screen from sleeping on mobile using the Wake Lock API
let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake lock acquired');
            wakeLock.addEventListener('release', () => {
                console.log('Wake lock released');
            });
        } catch (err) {
            console.error('Unable to obtain wake lock:', err);
        }
    } else {
        console.warn('Wake Lock API not supported in this browser');
    }
}

// re-request when the page becomes visible again (some browsers release it)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        requestWakeLock();
    }
});

// try to get a wake lock on load
requestWakeLock();

// RECEIVE

socket.on("connect", () => {            
     console.log("Connected to server!");
     socketID = socket.id;  // unique random 20-character id is given to client from server
     randomR = Math.floor(Math.random()*256);   // generate random colors for this client
     randomG = Math.floor(Math.random()*256);
     randomB = Math.floor(Math.random()*256);
  });

socket.on("message", myJSobj => {
    console.log(myJSobj.offset);
    console.log(myJSobj.startTime);
    console.log(myJSobj.operation);
    if (myJSobj.operation === "stop") {
        togglePause();
        return;
    }
    else if (myJSobj.operation === "start") {
        // get latency
        const latency = Date.now() - myJSobj.startTime;
        console.log("Latency: " + latency + " ms");
        start(myJSobj.offset + latency);  // start clock with offset + latency to sync with server
    }
});

// SEND

function sendMessage() {
    socket.emit("message", { offset: Date.now() });  // send current time to server
}