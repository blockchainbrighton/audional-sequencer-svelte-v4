import { writable } from 'svelte/store';

export const steps = writable(Array(64).fill(false));
export const muteState = writable(false); // This will store the global mute state
