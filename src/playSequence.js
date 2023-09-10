
import { getBufferedAudio } from './audioLoader.js';
import audioContext from './audioContext.js';
console.log('audioContext initialized in playSequence.');
import { gainNode } from './audioManager.js';
import { muteState } from './store.js';

let currentMuteState = false;
muteState.subscribe(value => currentMuteState = value);  // Subscribe to the muteState store


let isPlaying = false;
let intervalId;
let currentStep = 1; // <-- Add this line








function playSample(volume) {
    console.log('AudioContext state before playing:', audioContext.state);
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const buffer = getBufferedAudio();
    if (!buffer) {
        console.error("Buffer is not available!");
        return;
    }

    console.log('Buffer to play:', buffer);
    // Check the mute state and set the gain value
    if (currentMuteState) { // <-- Use currentMuteState here
        gainNode.gain.value = 0;
    } else {
        gainNode.gain.value = volume / 100;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    console.log('Buffer length:', buffer.length);
    console.log('Buffer duration:', buffer.duration);
    console.log('Buffer sampleRate:', buffer.sampleRate);
    console.log('Buffer numberOfChannels:', buffer.numberOfChannels);

    // Volume control
    gainNode.gain.value = volume / 100;  // Assuming volume is between 0 and 100
    console.log('Volume set to:', gainNode.gain.value);
    
    source.connect(gainNode); // Connect the source to the gain node

    console.log('About to play sample...');
    source.start(0);    
    console.log('Sample should be playing now...');
    console.log('Playing the sample with volume:', volume);
    source.onerror = function(e) {
        console.error('Error playing audio:', e);
    };
    source.onended = function() {
        console.log('Sample playback ended.');
    };
    
    console.log('Source connected to:', source.context.destination);
}


function playStep(steps, currentStep, volume) {
    if (steps[currentStep]) {
        console.log(`Playing step ${currentStep} at time ${Date.now()}`);
        playSample(volume);
    }
}



export function startSequence(steps, initialStep, volume) {
    if (currentMuteState) {  // Check the global mute state
        gainNode.gain.value = 0; // Ensure mute is active if muteActive is true
    }
    
    if (!isPlaying) {
        currentStep = initialStep; // <-- Add this line
        isPlaying = true;
        intervalId = setInterval(() => {
            playStep(steps, currentStep, volume);
            currentStep = (currentStep + 1) % steps.length;  // Cycle through steps
        }, 500); 
        console.log('Starting the sequence with steps:', steps);
        console.log('Sequence started');
    }
}
export function pauseSequence() {
    if (isPlaying) {
        clearInterval(intervalId);
        isPlaying = false;
        console.log('Sequence paused');
    }
}

export function stopSequence() {
    pauseSequence();
    currentStep = 0;
    console.log('Sequence stopped');
}

export { playSample };
