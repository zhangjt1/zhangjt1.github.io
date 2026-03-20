const display = document.getElementById("display");

let timer = null;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;

function start(offset = 0) {
    clearInterval(timer);
    isRunning = true;
    elapsedTime = offset;
    startTime = Date.now() - offset;
    // immediately update display so any offset is visible
    update();

    timer = setInterval(update, 100);
}

function togglePause() {
    clearInterval(timer);
    timer = null;
    isRunning = false;
}

function update() {
    elapsedTime = Date.now() - startTime;

    const isNegative = elapsedTime < 0;
    const absElapsed = Math.abs(elapsedTime);

    const hours = Math.floor(absElapsed / 3600000);
    const minutes = Math.floor((absElapsed % 3600000) / 60000);
    const seconds = Math.floor((absElapsed % 60000) / 1000);
    const milliseconds = Math.floor((absElapsed % 1000) / 100);
    const sign = isNegative ? '-' : '';
    display.textContent = `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
}

export { start, togglePause };