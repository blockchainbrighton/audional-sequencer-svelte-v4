import { get } from 'svelte/store';
import audioContext from './audioContext.js';
import { muteState } from './store.js';

// Create a GainNode for the entire application
const gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination);

// Check the mute state immediately after creating the GainNode
if (get(muteState)) {
    gainNode.gain.value = 0;
}

export { gainNode };
