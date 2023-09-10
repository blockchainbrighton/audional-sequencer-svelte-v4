
import { getBufferedAudio } from './audioLoader.js';
import audioContext, { gainNode } from './audioContext.js';

let isPlaying = false;
let intervalId;
let currentStep = 1;

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

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    console.log('Buffer length:', buffer.length);
    console.log('Buffer duration:', buffer.duration);
    console.log('Buffer sampleRate:', buffer.sampleRate);
    console.log('Buffer numberOfChannels:', buffer.numberOfChannels);
    
    source.connect(gainNode);  // Connect the source to the gain node

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
