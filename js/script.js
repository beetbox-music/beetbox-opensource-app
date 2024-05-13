let beat = 0, started = false, playing = false, delay = false, reverb = false; 

// DEFAULT DATA
let data = {
    grid: [],
    master: {
        bpm: { label: "bpm", value: 120, min: 40, max: 240, value: 120 },
        swing: { label: "swing", value: 0, min: 0, max: 100, value: 0 },
        reverb: { label: "reverb", value: 0, min: 0, max: 100, value: 50 },
        delayTime: { label: "delayTime", value: 0, min: 0, max: 100, value: 0 },
        delayFeedback: { label: "delayFeedback", value: 0, min: 0, max: 100, value: 0 },
        numberOfBeats: { label: "numberOfBeats", value: 16, min: 6, max: 144, value: 16 },
        barLength: { label: "barLength", value: 4, min: 2, max: 5, value: 4 }
    },
    instruments: {
        generalSettings: {
            volume: { sliderMin: 0, sliderMax: 100, min: -60, max: 30 },
            attack: { sliderMin: 0, sliderMax: 100, min: 0, max: 1 },
            decay: { sliderMin: 0, sliderMax: 100, min: 0, max: 1 },
            sustain: { sliderMin: 0, sliderMax: 100, min: 0, max: .5 },
            release: { sliderMin: 0, sliderMax: 100, min: 0, max: .5 },
            tone: { sliderMin: 1, sliderMax: 68, min: 1, max: 68 },
            type: ["SimpleSynth","MembraneSynth","MembraneNoiseSynth","NoiseSynth"],
            oscillator: [
                "sine","pulse","fmsine","fmsquare","fmsawtooth","fmtriangle",
                "amsine","amsquare","amsawtooth","amtriangle",
                "fatsine","fatsquare","fatsawtooth","fattriangle"
            ]
        },
        instrumentSettings: [
            {
                title: "snare",
                color: "rgb(214 37 87)",
                values: {
                    type: "MembraneNoiseSynth",
                    oscillator: "fmsine",
                    volume: 50,
                    attack: 0,
                    decay: 10,
                    sustain: 0,
                    release: 1,
                    tone: 15,
                }
            }, {
                title: "kick",
                color: "rgb(18 179 146)",
                values: {
                    type: "MembraneSynth",
                    oscillator: "fmsine",
                    volume: 50,
                    attack: 5,
                    decay: 10,
                    sustain: 10,
                    release: 1,
                    tone: 1,
                }
            }, {
                title: "closed hat",
                color: "rgb(162 151 32)",
                values: {
                    type: "NoiseSynth",
                    volume: 50,
                    attack: 0,
                    decay: 5,
                    sustain: 0,
                    release: 0
                }
            }
        ]
    }
};
let sounds = [];

// INSTRUMENTS
function makeInstrument(instrument) {
    let synth = {};
    const attackSettings = data.instruments.generalSettings.attack;
    const decaySettings = data.instruments.generalSettings.decay;
    const sustainSettings = data.instruments.generalSettings.sustain;
    const releaseSettings = data.instruments.generalSettings.release;
    let oscillator = instrument.values.oscillator;
    if(!["sine","pulse"].includes(oscillator)){oscillator = oscillator + "1"}

    const envelope = {
        attack: mapValue(instrument.values.attack, attackSettings.sliderMin, attackSettings.sliderMax, attackSettings.min, attackSettings.max),
        decay: mapValue(instrument.values.decay, decaySettings.sliderMin, decaySettings.sliderMax, decaySettings.min, decaySettings.max),
        sustain: mapValue(instrument.values.sustain, sustainSettings.sliderMin, sustainSettings.sliderMax, sustainSettings.min, sustainSettings.max),
        release: mapValue(instrument.values.release, releaseSettings.sliderMin, releaseSettings.sliderMax, releaseSettings.min, releaseSettings.max),
        attackCurve: 'exponential'
    };

    switch (instrument.values.type) {
        case "MembraneNoiseSynth":
            synth.membrane = new Tone.MembraneSynth({
                pitchDecay: 0.05, octaves: 10, oscillator: { type: oscillator}, envelope
            });
            synth.noise = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope });
            break;
        case "MembraneSynth":
            synth.membrane = new Tone.MembraneSynth({
                pitchDecay: 0.05, octaves: 10, oscillator: { type: oscillator}, envelope
            });
            break;
        case "NoiseSynth":
            synth.noise = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope });
            break;
        case "SimpleSynth":
            synth.synth = new Tone.Synth({ oscillator: { type: oscillator}, envelope });
            break;
    }

    Object.values(synth).forEach(component => {
        component.connect(reverb).connect(delay).toDestination();
        const volumeSettings = data.instruments.generalSettings.volume;
        component.volume.value = mapValue(instrument.values.volume, volumeSettings.sliderMin, volumeSettings.sliderMax, volumeSettings.min, volumeSettings.max);
    });
    return synth;
}
function soundDispose(sound) {
    if (sound.membrane) sound.membrane.dispose();
    if (sound.noise) sound.noise.dispose();
    if (sound.synth) sound.synth.dispose();
};
function makeInstrumentsSounds() {
    sounds.map(soundDispose);
    sounds = data.instruments.instrumentSettings.map(makeInstrument);
}
function setMasterSettings() {
    Tone.Transport.swingSubdivision = "8n";
    Tone.Transport.swing = data.master.swing.value / 100;
    Tone.Transport.bpm.value = data.master.bpm.value;

    if (!reverb) {
        reverb = new Tone.Reverb(1.5).toDestination();
    }
    if (!delay) {
        delay = new Tone.FeedbackDelay('8n', 0.5).toDestination();
    }

    reverb.wet.value = data.master.reverb.value / 100;
    delay.delayTime.value = ((Tone.Transport.bpm.value / 100) * data.master.delayTime.value * 4) / 1000;
    delay.feedback.value = data.master.delayFeedback.value / 100;

}
function addInstrument() {
    const formData = getFormData();

    const newInstrument = {
        title: formData.name,
        color: formData.color,
        values: {
            type: formData.type,
            oscillator: formData.oscillator + "1",
            volume: formData.volume,
            attack: formData.attack,
            decay: formData.decay,
            sustain: formData.sustain,
            release: formData.release,
            tone: formData.tone
        }
    };

    data.instruments.instrumentSettings.push(newInstrument);
    hidePanels();
    makeInstrumentsSounds();
    updateGrid();
    buildGridUI();
    if (playing) { restartPlay(); } else { resetPlay() };
}
function getFormData() {
    return {
        name: document.getElementById('name').value,
        color: document.getElementById('color').value,
        volume: parseInt(document.getElementById('volume-slider').value, 10),
        attack: parseInt(document.getElementById('attack-slider').value, 10),
        decay: parseInt(document.getElementById('decay-slider').value, 10),
        sustain: parseInt(document.getElementById('sustain-slider').value, 10),
        release: parseInt(document.getElementById('release-slider').value, 10),
        tone: parseInt(document.getElementById('tone-slider').value, 10),
        type: document.getElementById('type').value,
        oscillator: document.getElementById('oscillator').value
    }
}
function addPianoKeys(
    oscillator = "fatsine",
    octave = 1, octaves = 1, volume = 60, attack = 15, decay = 1, sustain = 1, release = 1, colorBlack = "#4a4a4a", colorWhite = "#9a9a9a") {
    const octave_offset = octave * 12 + 1;
    const blackKeys = [1, 3, 6, 8, 10]; // extend list based on number of octaves

    for (let i = 0; i < 1 + 12 * octaves; i++) {

        const title = numToTone(octave_offset + i);
        const color = blackKeys.includes(i % 12) ? colorBlack : colorWhite;

        data.instruments.instrumentSettings.push({
            title: title,
            color: color,
            values: {
                type: "SimpleSynth",
                oscillator: oscillator + (i + 1),
                volume: volume,
                attack: attack,
                decay: decay,
                sustain: sustain,
                release: release,
                tone: 13+i
            }
        })

    }


}
function getInstrumentNames() {
    if (!data.instruments.instrumentSettings || !Array.isArray(data.instruments.instrumentSettings)) { return []; }
    return data.instruments.instrumentSettings.map(instrument => instrument.title);
}
function getInstrumentIndex(instrumentName) {
    return data.instruments.instrumentSettings.findIndex(function (element) { return element.title === instrumentName; });
}
function getInstrumentColor(instrumentName) {
    if (!data.instruments.instrumentSettings || !Array.isArray(data.instruments.instrumentSettings)) { return null; }
    const instrument = data.instruments.instrumentSettings.find(instr => instr.title === instrumentName);
    return instrument ? instrument.color : null;
}
async function deleteInstrument(instrumentName) {
    let confirmed = await customModal('clear beat');
    if (confirmed) {
        const instrumentIndex = getInstrumentIndex(instrumentName);
        data.instruments.instrumentSettings.splice(instrumentIndex, 1);
        sounds.splice(instrumentIndex, 1);
        data.grid.splice(instrumentIndex, 1);
        updateGrid();
        buildGridUI();
    }
}
let tempInstrument = null;
function testInstrument() {
    const formData = getFormData();
    
    if(tempInstrument)soundDispose(tempInstrument);
    tempInstrument = makeInstrument({
        values: {
            volume: formData.volume,
            attack: formData.attack,
            decay: formData.decay,
            sustain: formData.sustain,
            release: formData.release
        },
        type: formData.type,
        oscillator: formData.oscillator + "1"
    })
    if (tempInstrument.membrane) tempInstrument.membrane.triggerAttackRelease(numToTone(formData.tone), "8n");console.log("testtt");
    if (tempInstrument.noise) tempInstrument.noise.triggerAttackRelease("8n");
    if (tempInstrument.synth) tempInstrument.synth.triggerAttackRelease(numToTone(formData.tone), "8n");
}

// LOOP
function configLoop() {
    const repeat = (time) => {
        data.grid.forEach((row, index) => {
            if (row[beat]) {

                const instrumentType = data.instruments.instrumentSettings[index].values.type;

                switch (instrumentType) {
                    case "NoiseSynth":
                        sounds[index].noise.triggerAttackRelease("8n", time);
                        break;
                    case "MembraneNoiseSynth":
                        sounds[index].noise.triggerAttackRelease("8n", time);
                        sounds[index].membrane.triggerAttackRelease(
                            numToTone(data.instruments.instrumentSettings[index].values.tone),
                            "8n",
                            time
                        );
                        break;
                    case "MembraneSynth":
                        sounds[index].membrane.triggerAttackRelease(
                            numToTone(data.instruments.instrumentSettings[index].values.tone),
                            "8n",
                            time
                        );
                        break;
                    case "SimpleSynth":
                        sounds[index].synth.triggerAttackRelease(
                            numToTone(data.instruments.instrumentSettings[index].values.tone),
                            "8n",
                            time
                        );
                        break;
                }
            }
        });
        const beatIndicators = document.querySelectorAll(".beat-indicator.beat-button");
        beatIndicators.forEach((indicator, index) => {
            if (index === beat) {
                indicator.classList.add("is-active");
            } else {
                indicator.classList.remove("is-active");
            }
        });

        beat = (beat + 1) % data.master.numberOfBeats.value;
    };
    Tone.Transport.scheduleRepeat(repeat, "16n");
}

// SEQUENCER CONTROLS
const playButton = document.getElementById("play-button");
function configSequencerControls() {

    const addInstButton = document.getElementById("add-instrument-button");
    addInstButton.addEventListener("click", () => {

        const newInstrumentFormContainer = document.getElementById("new-instrument");
        newInstrumentFormContainer.innerHTML = "";
        const header = createPanelHeader("New Instrument", false);
        newInstrumentFormContainer.appendChild(header);
        const initialSettings = {volume: 50,attack:5,decay:5,sustain:5,release:5,tone:37,type:"SimpleSynth",oscillator:"fmsine"};

        const nameInput = `<h4 for="name">Instrument Name:</h4><input type="text" id="name" name="name" value="inst-${data.instruments.instrumentSettings.length+1}" required>`;
        newInstrumentFormContainer.insertAdjacentHTML("beforeEnd",nameInput);
        createSliderWithButtons(newInstrumentFormContainer,initialSettings,1,null);
        const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const colorInput = `<h4 for="color">Color:</h4><input type="color" id="color" name="color" value="${randomColor}">`;
        newInstrumentFormContainer.insertAdjacentHTML("beforeEnd",colorInput);
        const formButtonsContainer = document.createElement("div");
        formButtonsContainer.className = "form-buttons-container";
        const submitButton = createButton("Add","submit-new-instrument-form","button");
        const testButton = createButton("Test","test-instrument","button");
        formButtonsContainer.appendChild(testButton);
        formButtonsContainer.appendChild(submitButton);
        newInstrumentFormContainer.appendChild(formButtonsContainer);
        showPanel("new-instrument");
        document.getElementById('test-instrument').addEventListener('click', testInstrument);
        document.getElementById('submit-new-instrument-form').addEventListener('click', function (event) {
            addInstrument();
        });

    })

    playButton.addEventListener("click", () => {
        togglePlay();
    });
    const clearAllButton = document.getElementById('clear-all-button');
    clearAllButton.addEventListener('click', () => {
        unselectAll();
    });

    const masterButton = document.getElementById("master-button");
    masterButton.addEventListener("click", () => showPanel("master-settings"))

}
function togglePlay() {
    if (!started) {
        Tone.start();
        Tone.getDestination().volume.rampTo(-10, 0.001);
        configLoop();
        started = true;
    }
    if (playing) {
        updateButtonLabel('▶', playButton);
        Tone.Transport.stop();
        playing = false;
    } else {
        updateButtonLabel('II', playButton);
        Tone.Transport.start();
        playing = true;
    }
}
function resetPlay() {
    updateButtonLabel('▶', playButton); // Update the button label
    Tone.Transport.stop(); // Stop the transport
    Tone.Transport.cancel(); // Cancel scheduled events
    Tone.Transport.seconds = 0; // Reset the transport time to 0
    playing = false; // Reset playing state
    started = false; // Reset started state
}
function restartPlay() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    configLoop();
    Tone.start();
    Tone.Transport.start();
    Tone.getDestination().volume.rampTo(-10, 0.001);

}
function updateButtonLabel(text, element, color = false) {
    const span = document.createElement('span');
    span.innerText = text;
    element.innerHTML = '';
    if (color) {
        span.style.color = color;
    }
    element.appendChild(span);
}

// SEQUENCER GRID BOARD
function beatButtonClick(clickedRowIndex, clickedNoteIndex, e) {

    let beatButton = data.grid[clickedRowIndex][clickedNoteIndex];
    beatButton = !beatButton; // toggle T/F
    data.grid[clickedRowIndex][clickedNoteIndex] = beatButton;
    if (beatButton) {
        e.target.classList.add('is-active');
    } else {
        e.target.classList.remove('is-active');
    }
}
function buildGridUI() {
    // board container
    const grid = data.grid;
    const instrumentNames = getInstrumentNames();
    const sequencerBoard = document.getElementById("sequencer-board");
    sequencerBoard.innerHTML = "";

    // instrument 
    // - buttons
    const instrumentButtonsContainer = document.createElement("div");
    instrumentButtonsContainer.className = "instrument-buttons-container";
    // - beats
    const instrumentBeatsContainer = document.createElement("div");
    instrumentBeatsContainer.className = "instrument-beats-container";
    grid.forEach((instrumentBeats, instrumentIndex) => {
        const instrumentName = instrumentNames[instrumentIndex];

        // - buttons
        const instrumentButtonContainer = document.createElement("div");

        const instrumentButton = createButton(instrumentName, "", "instrument-button", "");
        instrumentButton.style.backgroundColor = getInstrumentColor(instrumentName);
        instrumentButton.addEventListener("click", () => {
            configInstrumentButton(instrumentName);
        });
        const instrumentMuteButton = createButton("M", instrumentName + "-mute-button", "mute-button opacity50");
        instrumentMuteButton.style.backgroundColor = getInstrumentColor(instrumentName);
        instrumentMuteButton.addEventListener("click", () => {
            toggleMute(instrumentName);
        });

        instrumentButtonContainer.appendChild(instrumentButton);
        instrumentButtonContainer.appendChild(instrumentMuteButton);
        instrumentButtonsContainer.appendChild(instrumentButtonContainer);


        // - beats
        const instrumentBeatButtonsContainer = document.createElement("div");
        instrumentBeatButtonsContainer.className = "instrument-beat-buttons-container";

        instrumentBeats.forEach((beatButton, beatButtonIndex) => {
            const beatButtonDiv = document.createElement("div");
            beatButtonDiv.classList.add("beat-button");
            beatButtonDiv.classList.add("button");
            if (grid[instrumentIndex][beatButtonIndex]) { beatButtonDiv.classList.add("is-active"); }
            if (beatButtonIndex >= data.master.numberOfBeats.value) { beatButtonDiv.classList.add("hidden") }
            beatButtonDiv.id = "beat-button-" + instrumentName + beatButtonIndex;
            beatButtonDiv.style.backgroundColor = getInstrumentColor(instrumentName);
            beatButtonDiv.addEventListener("click", function (e) {
                beatButtonClick(instrumentIndex, beatButtonIndex, e);
            });
            instrumentBeatButtonsContainer.appendChild(beatButtonDiv);
        });

        instrumentBeatsContainer.appendChild(instrumentBeatButtonsContainer);

    });

    // beat indicator
    // - button
    const beatIndicatorButton = createButton("Beat", "", "beat-indicator-button",);
    instrumentButtonsContainer.appendChild(beatIndicatorButton);
    // - beat
    const beatIndicatorButtonsContainer = document.createElement("div");
    beatIndicatorButtonsContainer.className = "beat-indicator-buttons-container";

    for (let i = 0; i < data.master.numberOfBeats.max; i++) {
        const beatIndicatorButton = document.createElement("div");
        beatIndicatorButton.className = "beat-indicator beat-button button";
        if (i >= data.master.numberOfBeats.value) { beatIndicatorButton.classList.add("hidden") }
        beatIndicatorButtonsContainer.appendChild(beatIndicatorButton);
    }
    instrumentBeatsContainer.appendChild(beatIndicatorButtonsContainer);

    // scrolling
    let isSyncingUpScroll = false;
    let isSyncingDowntScroll = false;
    instrumentButtonsContainer.onscroll = function () {
        if (!isSyncingUpScroll) {
            isSyncingDowntScroll = true;
            instrumentBeatsContainer.scrollLeft = this.scrollLeft;
        }
        isSyncingUpScroll = false;
    }
    instrumentBeatsContainer.onscroll = function () {
        if (!isSyncingDowntScroll) {
            isSyncingUpScroll = true;
            instrumentButtonsContainer.scrollLeft = this.scrollLeft;
        }
        isSyncingDowntScroll = false;
    }

    sequencerBoard.appendChild(instrumentButtonsContainer);
    sequencerBoard.appendChild(instrumentBeatsContainer);

    updateBarHighlight();

}
function buildGridMatrix() {
    const instruments = getInstrumentNames();
    const n_beats = data.grid ? data.master.numberOfBeats.max : 0;

    const grid = [];
    for (const note of instruments) {
        const row = [];
        for (let i = 0; i < n_beats; i++) { // Use columns instead of a fixed number
            row.push(false);
        }
        grid.push(row);
    }
    return grid;
}
function buildGrid() {
    data.grid = buildGridMatrix();
    buildGridUI();
}
function updateGrid() {
    const n_beats = data.grid ? data.master.numberOfBeats.max : 0;
    const instruments = getInstrumentNames();
    let newInstruments;

    if (instruments.length > data.grid.length) {
        newInstruments = instruments.slice(data.grid.length);
        newInstruments.forEach((instrument, index) => {
            const row = [];
            for (let i = 0; i < n_beats; i++) {
                row.push(false);
            }
            data.grid.push(row);
        });
    }
}
function buildSequencer() {
    buildGrid();
    setMasterSettings();
    makeInstrumentsSounds();
}
function updateBarHighlight() {

    // Apply highlight on instruments
    const instrumentNames = getInstrumentNames();
    instrumentNames.forEach(instrument => {
        for (let j = 0; j < data.master.numberOfBeats.value; j++) {
            const beatButtonId = `beat-button-${instrument}${j}`;
            const beatButton = document.getElementById(beatButtonId);
            if (beatButton) {
                beatButton.classList.toggle('highlight', j % data.master.barLength.value === 0);
            }
        }
    });

    // Apply highlight on beat indicator
    document.querySelectorAll('.beat-indicator.beat-button').forEach((beatIndicatorButton, index) => {
        beatIndicatorButton.classList.toggle('highlight', index % data.master.barLength.value === 0);
        const barClass = `bar${Math.floor(index / data.master.barLength.value)}`;
        beatIndicatorButton.classList.add(barClass);
    });
}
function updateVisibleGrid(n) {
    const buttonContainers = document.querySelectorAll("*:is(.instrument-beat-buttons-container,.beat-indicator-buttons-container)");
    buttonContainers.forEach(container => {
        const beatButtons = container.querySelectorAll(".beat-button");
        beatButtons.forEach((button, index) => {
            if (index < n) { button.classList.remove("hidden"); }
            else { button.classList.add("hidden"); }
        });
    });
}

// MASTER AND INSTRUMENT SETTINGS
function dataSoundSetter(key, value, instrumentName = null) {
    if (instrumentName) {
        // DRY UP
        data.instruments.instrumentSettings[getInstrumentIndex(instrumentName)].values[key] = value;
        if (key != "tone") {
            const generalSettings = data.instruments.generalSettings;
            const newValue = mapValue(
                value, generalSettings[key].sliderMin, generalSettings[key].sliderMax, generalSettings[key].min, generalSettings[key].max);
            const sound = sounds[getInstrumentIndex(instrumentName)];
            if(key == "volume"){
                if(sound.noise) sound.noise[key].value = newValue;
                if(sound.synth) sound.synth[key].value = newValue;
                if(sound.membrane) sound.membrane[key].value = newValue;
            }else{
                if(sound.noise)sound.noise.envelope[key] = newValue;
                if(sound.synth)sound.synth.envelope[key] = newValue;
                if(sound.membrane)sound.membrane.envelope[key] = newValue;
            }
        }
    } else if (["bpm", "delayTime", "delayFeedback", "reverb", "swing"].includes(key)) {
        data.master[key].value = value;
        setMasterSettings();
    } else if ("numberOfBeats" == key) {
        data.master[key].value = value;
        updateVisibleGrid(value);
        updateBarHighlight();
    } else if ("barLength" == key) {
        data.master[key].value = value;
        updateBarHighlight();
    }
}
function dataSoundGetter(key, instrumentName = null) {
    if (instrumentName) {
        return data.instruments.instrumentSettings[getInstrumentIndex(instrumentName)].values[key];
    } else {
        return data.master[key].value;
    }
}
function createPanelHeader(label, isInstrument = true) {
    const header = document.createElement('div');
    header.className = "panel-header";
    const headerLabel = document.createElement("h2");
    headerLabel.innerText = label;
    header.appendChild(headerLabel);


    if (isInstrument) {
        const headerDeleteButton = document.createElement("div");
        headerDeleteButton.innerHTML = "<span>DELETE<span/>";
        headerDeleteButton.className = "panel-delete-button";
        headerDeleteButton.addEventListener("click", () => {
            deleteInstrument(label);
        })
        header.appendChild(headerDeleteButton);
    }

    const headerCloseButton = document.createElement("div");
    headerCloseButton.innerHTML = "<span>✖<span/>";
    headerCloseButton.className = "panel-close-button";
    header.appendChild(headerCloseButton);
    headerCloseButton.addEventListener("click", () => {
        hidePanels()
    })

    return header
}
function createButton(label = "", id = "", className = "", labelId = "") {
    const button = document.createElement("div");
    button.id = id;
    button.className = "button "+ className;
    const buttonSpan = document.createElement("span");
    buttonSpan.id = labelId;
    buttonSpan.innerText = label;
    button.appendChild(buttonSpan);
    return button;
}
function createSliderWithButtons(container, settings, instrumentName = null, setter = dataSoundSetter) {
    Object.entries(settings).forEach(([key, setting]) => {
        // Determine if we're working with a complex setting object or a simple value
        const isInstrumentSetting = instrumentName == null ? false : true;
        const labelTxt = isInstrumentSetting ? key : setting.label;
        const isDropdown = ["type","oscillator"].includes(key);

        if(isDropdown){
            const options = data.instruments.generalSettings[key];
            const dropdownMenu = document.createElement("select");
            dropdownMenu.id = key; // Setting the id for the select element
            dropdownMenu.name = key; // Setting the name for the select element
            options.forEach(optionValue => {
                // Create an option element
                const option = document.createElement("option");
                option.value = optionValue;
                option.textContent = optionValue;                
                dropdownMenu.appendChild(option);
            });
            
            dropdownMenu.addEventListener('input', function () {
                if(setter)setter(key, this.value, instrumentName);
            });
            container.insertAdjacentHTML("beforeEnd",`<h4>${key}</h4>`);
            container.appendChild(dropdownMenu);
        }
        else{
            const min = isInstrumentSetting ? data.instruments.generalSettings[key].sliderMin : setting.min;
            const max = isInstrumentSetting ? data.instruments.generalSettings[key].sliderMax : setting.max;
            const value = isInstrumentSetting ? setting: setting.value;
    
            // Create the slider components
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'slider-buttons';
            const label = document.createElement('h4');
            const labelSpan = document.createElement("span");
            label.innerText = labelTxt + ": ";
            labelSpan.id = key + "-value";
            labelSpan.innerText = key === "tone" ? numToTone(value) : value;
            label.appendChild(labelSpan);
    
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'slider';
            slider.id = `${key}-slider`;
            slider.min = min;
            slider.max = max;
            slider.value = value;
            slider.step = '1';
            slider.addEventListener('input', function () {
                labelSpan.innerText = key === "tone" ? numToTone(this.value) : this.value;
                if(setter)setter(key, this.value, instrumentName);
            });
    
            const minusButton = document.createElement('div');
            minusButton.className = 'button-minus button';
            minusButton.id = `${key}-slider-minus`;
            minusButton.innerHTML = '<span>-</span>';
            minusButton.addEventListener('click', function () {
                const currentValue = parseInt(labelSpan.innerText, 10);
                if (currentValue > min) {
                    labelSpan.innerText = key === "tone" ? numToTone(currentValue - 1) : currentValue - 1;
                    if(setter)setter(key, currentValue - 1, instrumentName);
                    slider.value = currentValue - 1;
                }
            });
    
            const plusButton = document.createElement('div');
            plusButton.className = 'button-plus button';
            plusButton.id = `${key}-slider-plus`;
            plusButton.innerHTML = '<span>+</span>';
            plusButton.addEventListener('click', function () {
                const currentValue = parseInt(labelSpan.innerText, 10);
                if (currentValue < max) {
                    labelSpan.innerText = key === "tone" ? numToTone(currentValue + 1) : currentValue + 1;
                    if(setter)setter(key, currentValue + 1, instrumentName);
                    slider.value = currentValue + 1;
                }
            });
    
            // Append the components to the container
            sliderContainer.appendChild(minusButton);
            sliderContainer.appendChild(slider);
            sliderContainer.appendChild(plusButton);
            container.appendChild(label);
            container.appendChild(sliderContainer);
        }
    });
}
function configMasterSettings() {
    const masterSettingsContainer = document.getElementById("master-settings");
    const header = createPanelHeader("Master", false);
    masterSettingsContainer.appendChild(header);
    createSliderWithButtons(masterSettingsContainer, data.master)
}
function configInstrumentButton(instrumentName) {

    // Get Container
    const instrumentSettingsContainer = document.getElementById("instrument-settings")
    instrumentSettingsContainer.innerHTML = "";

    // Header
    const header = createPanelHeader(instrumentName);
    instrumentSettingsContainer.appendChild(header);

    createSliderWithButtons(
        instrumentSettingsContainer,
        data.instruments.instrumentSettings[getInstrumentIndex(instrumentName)].values,
        instrumentName);

    showPanel("instrument-settings");
}
function toggleMute(instrumentName) {
    const currentVolume = dataSoundGetter("volume", instrumentName);
    const unmutedVolume = data.instruments.instrumentSettings[getInstrumentIndex(instrumentName)].unmutedVolume;
    if (currentVolume > 0) {
        data.instruments.instrumentSettings[getInstrumentIndex(instrumentName)].unmutedVolume = currentVolume;
        dataSoundSetter("volume", 0, instrumentName);
        document.getElementById(instrumentName + "-mute-button").classList.remove("opacity50");
    }
    else if (currentVolume === 0 && unmutedVolume != null) {
        dataSoundSetter("volume", unmutedVolume, instrumentName);
        document.getElementById(instrumentName + "-mute-button").classList.add("opacity50");
        data.instruments.instrumentSettings[getInstrumentIndex(instrumentName)].unmutedVolume = null;
    }
}
function hidePanels() {
    document.querySelectorAll('#hidden-containers > div').forEach(function (element) {
        element.classList.remove('show-hidden-containers');
    })
}
function showPanel(id) {
    document.getElementById(id).classList.add('show-hidden-containers');
}


// CUSOTM MODALs
function customModal(text) {
    return new Promise((resolve, reject) => {
        // Get elements
        const modal = document.getElementById('custom-modal-container');

        modal.innerHTML = `
        <div id="custom-modal">
            <div id="custom-modal-text"><span>CONFIRM ACTION</span><span id="custom-modal-text-span">${text}</span></div>
            <div id="custom-modal-buttons">
            <div id="custom-modal-yes" class="button"><span>YES</span></div>
            <div id="custom-modal-no" class="button"><span>NO</span></div>
            </div>
        </div>
        `;

        const yesButton = document.getElementById('custom-modal-yes');
        const noButton = document.getElementById('custom-modal-no');

        // Show modal
        modal.classList.add('show-modal');

        // Event listeners for buttons
        const onYes = () => {
            cleanup();
            resolve(true);
        };

        const onNo = () => {
            cleanup();
            resolve(false);
        };

        yesButton.addEventListener('click', onYes);
        noButton.addEventListener('click', onNo);

        // Cleanup function to remove event listeners and hide modal
        function cleanup() {
            yesButton.removeEventListener('click', onYes);
            noButton.removeEventListener('click', onNo);
            modal.classList.remove('show-modal');
        }
    });
}

// UTILITY
function unselectRow(i) {
    const instrumentNames = getInstrumentNames();
    for (let b = 0; b <= data.master.numberOfBeats.value - 1; b++) {
        data.grid[i][b] = false;
        let beatButton = document.getElementById('beat-button-' + instrumentNames[i] + b);
        beatButton.classList.remove('is-active');
    }
}
async function unselectAll(confirm = true) {
    let confirmed;
    if (confirm) {
        confirmed = await customModal('clear beat');
    }
    else {
        confirmed = true;
    }
    if (confirmed) {
        for (let i = 0; i < data.instruments.instrumentSettings.length; i++) {
            unselectRow(i);
        }
    }

}
function mapValue(value, fromMin, fromMax, toMin, toMax) {
    return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
}
function numToTone(n) {
    let tone = ['C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1', 'A1', 'A#1', 'B1',
        'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
        'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
        'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
        'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
        'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6'][n - 1];
    return tone
}
window.numToTone = numToTone;// for addInstrumentForm


// START-UP
addPianoKeys("fatsawtooth");
buildSequencer();
configSequencerControls();
configMasterSettings();
Tone.start();