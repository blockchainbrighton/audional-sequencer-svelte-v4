import { get } from 'svelte/store';
import { muteState } from './store.js';

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

console.log('audioContext initialized in audioContext.js.');

// Check the mute state immediately after creating the context
if (get(muteState)) {
    newAudioContext.gain.value = 0;
}

document.addEventListener('click', function() {
    audioContext.resume().then(() => {
        console.log('AudioContext resumed successfully.');
    }).catch((error) => {
        console.error('Failed to resume AudioContext:', error);
    });
}, { once: true });

// Ensure it's in "running" state
if (audioContext.state !== "running") {
    audioContext.resume().then(() => {
        console.log('AudioContext resumed successfully');
    }).catch(err => {
        console.error("Failed to resume AudioContext:", err);
    });
}

export default audioContext;
