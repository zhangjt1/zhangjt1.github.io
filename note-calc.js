let tk = null; // Global toolkit instance

const form = document.getElementById("myForm");
const frequencyInput = form.querySelector("input[name='frequency']");
const accidentalSelect = form.querySelector("select[name='accidentalType']");

// Function to update notation and result
function updateNotation() {
    const frequency = parseFloat(frequencyInput.value) || 440;
    const accidentalType = accidentalSelect.value;

    // calculate note value of frequency based on A4 = 440Hz
    const noteNumber = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
    const roundedNoteNumber = Math.round(noteNumber);
    const noteNames_sharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteNames_flat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    // Choose either sharp or flat note names
    const noteNames = accidentalType === "flat" ? noteNames_flat : noteNames_sharp;
    const noteIndex = roundedNoteNumber % 12;
    const octave = Math.floor((roundedNoteNumber / 12)) - 1;
    const centsDeviation = Math.floor((noteNumber - roundedNoteNumber) * 100);

    const noteName = noteNames[noteIndex] + octave;

    // Display result as HTML
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `
        <p>Note: ${noteName} ${centsDeviation} cents</p>
    `;

    // Render as notation using Verovio if toolkit is ready
    if (tk) {
        renderNoteToVerovio(noteNames[noteIndex], octave, centsDeviation);
    }
}

// Drag to change frequency
let isDragging = false;
let startY = 0;
let startValue = 0;

frequencyInput.addEventListener("mousedown", (event) => {
    isDragging = true;
    startY = event.clientY;
    startValue = parseFloat(frequencyInput.value) || 440;
    frequencyInput.style.cursor = "ns-resize";
});

document.addEventListener("mousemove", (event) => {
    if (!isDragging) return;
    
    const deltaY = startY - event.clientY; // Positive when dragging up
    const sensitivity = 2; // Hz per pixel
    const newValue = Math.max(20, Math.min(20000, startValue + (deltaY * sensitivity)));
    
    frequencyInput.value = newValue;
    updateNotation(); // Update in real-time while dragging
});

document.addEventListener("mouseup", () => {
    if (isDragging) {
        isDragging = false;
        frequencyInput.style.cursor = "default";
    }
});

// Update on input changes
frequencyInput.addEventListener("input", updateNotation);
accidentalSelect.addEventListener("change", updateNotation);

function microtoneAdjustment(centsDeviation, accidental) {
    if (centsDeviation === 0) {
        return null; // No adjustment needed
    }

    if (accidental === null) {
        // by range of values
        if (centsDeviation < -25) {
            return "1qf";
        }
        else if (centsDeviation < -5) {
            return "nd";
        }
        else if (centsDeviation < 5) {
            return null;
        }
        else if (centsDeviation < 25) {
            return "nu";
        }
        else {
            return "1qs";
        }
    }
    else if (accidental === "#") {
        if (centsDeviation < -25) {
            return "1qs";
        }
        else if (centsDeviation < -5) {
            return "sd";
        }
        else if (centsDeviation < 5) {
            return "s";
        }
        else if (centsDeviation < 25) {
            return "su";
        }
        else {
            return "3qs";
        }
    }
    else if (accidental === "b") {
        if (centsDeviation < -25) {
            return "3qf";
        }
        else if (centsDeviation < -5) {
            return "fd";
        }
        else if (centsDeviation < 5) {
            return "f";
        }
        else if (centsDeviation < 25) {
            return "fu";
        }
        else {
            return "1qf";
        }
    }
}

function renderNoteToVerovio(noteName, octave, centsDeviation) {
    // Parse note name to separate pitch class from accidental
    let pname = noteName.charAt(0).toLowerCase();
    let accidental = noteName.length > 1 ? noteName.substring(1) : null;
    
    // Determine microtone adjustment based on cents deviation and accidental type
    const microtoneAdjustedaccidental = microtoneAdjustment(centsDeviation, accidental);

    // Determine clef based on octave
    let clef = octave >= 4 ? 'G' : 'F';
    let clefLine = octave >= 4 ? 2 : 4;

    // Determine if octave mark is needed
    let octavedis = 0;
    if (octave >= 6) {
        octavedis = 8; // 8va
        if (octave >= 8) {
            octavedis = 15; // 15ma
            octave -= 1; // Adjust octave for 8va/15ma
        }
        octave -= 1; // Adjust octave for 8va/15ma
    } 
    else if (octave <= 2) {
        octavedis = 8; // 8vb
        if (octave <= 0) {
            octavedis = 15; // 15mb
            octave += 1; // Adjust octave for 15mb
        }
        octave += 1; // Adjust octave for 8vb/15mb
    }

    const octave_MEI = `<octave startid="note1" endid="note1" dis="${octavedis}" dis.place="${octave > 4 ? 'above' : 'below'}"/>`;


    // Create MEI data with the calculated note
    let meiData = `<?xml version="1.0" encoding="UTF-8"?>
    <mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="5.1">

    <meiHead>
        <fileDesc>
        <titleStmt>
        </titleStmt>
        <pubStmt>
            <publisher>Generated by Verovio</publisher>
        </pubStmt>
        </fileDesc>
    </meiHead>

    <music>
        <body>
        <mdiv>
            <score>
            <scoreDef>
                <staffGrp>
                    <staffDef n="1" clef.line="${clefLine}" clef.shape="${clef}" lines="5"/>
                </staffGrp>
            </scoreDef>

            <section>
                <measure n="1">
                    <staff n="1">
                        <layer n="1">
                            <note xml:id="note1" pname="${pname}" oct="${octave}" dur="4" >
                                <accid accid="${microtoneAdjustedaccidental ? microtoneAdjustedaccidental : 'n'}"/>
                            </note>
                        </layer>
                    </staff>
                ${octavedis !== 0 ? octave_MEI : ''}
                </measure>
            </section>

            </score>
        </mdiv>
        </body>
    </music>
    </mei>
    `;

    // Render the MEI data to SVG
    let svg = tk.renderData(meiData, {});
    document.getElementById("notation").innerHTML = svg;
}

document.addEventListener("DOMContentLoaded", (event) => {
    verovio.module.onRuntimeInitialized = async _ => {
        tk = new verovio.toolkit();
        tk.setOptions({
            pageWidth: 400,
            pageHeight: 200,
            adjustPageHeight: true,
            font: "Bravura",
        })

        console.log("Verovio has loaded!");
        updateNotation(); // Initial rendering
        };
}

);

