export const audioBuffers = new Map();
import audioContext from './audioContext.js';


const sampleUrl = "https://ipfs.io/ipfs/QmWuuNy5oRr85QKQvAj2eFK7dZiy6F8SaRD9cFGgqteZfi"; // Hardcoded sample URL

function getIDFromURL(url) {
    const parts = url.split('/');
    return parts[parts.length - 1];
}

export function loadSample(channelElement, channelIndex, loadSampleButtonElement) {
    console.log("loadSample function called with URL:", sampleUrl); // Log the URL

    fetchAudio(sampleUrl, channelElement, channelIndex, loadSampleButtonElement)
        .then(() => {
            console.log("Sample loaded successfully!"); // Log success
        })
        .catch(error => {
            console.error("Error loading sample:", error); // Log any errors
        });
}

function base64ToArrayBuffer(base64) {
    console.log("Converting base64 to ArrayBuffer");
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

const fetchAudio = async (url, channelElement, channelIndex, loadSampleButtonElement) => {
    console.log("fetchAudio function called with URL:", url);
    try {
        const response = await fetch(url);
        console.log("Response from fetch:", response);

        const data = await response.json();
        console.log("Data from response:", data);

        const audioData = base64ToArrayBuffer(data.audioData.split(',')[1]);
        console.log("Decoded audio data:", audioData);

        const audioBuffer = await decodeAudioData(audioData);
        console.log("Decoded audio buffer:", audioBuffer);
        audioBuffers.set(url, audioBuffer);
        console.log('Buffer set in audioLoader.');


        if (channelElement) {
            channelElement.dataset.originalUrl = url;
            channelElement.dataset.audioDataLoaded = 'true';
        } else {
            console.error(`Channel element for index ${channelIndex + 1} not found.`);
        }
        

        if (loadSampleButtonElement) {
            const filename = data.filename || data.fileName;
            loadSampleButtonElement.textContent = filename ? filename.substring(0,20) : 'Load New Audional';
            loadSampleButtonElement.title = filename ? filename : 'Load New Audional';
        } else {
            console.log("Button element not found.");
        }
    } catch (error) {
        console.error('Error fetching audio:', error);
    }
};

const decodeAudioData = (audioData) => {
    console.log("Decoding audio data");
    return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(audioData, resolve, reject);
    });
};

export function getBufferedAudio() {
    return audioBuffers.get(sampleUrl);
}

export { getIDFromURL, base64ToArrayBuffer, decodeAudioData };

