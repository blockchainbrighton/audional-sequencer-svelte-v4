class Sequencer {
    constructor(callback, tempo = 120) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.currentStep = 1;
        this.isPlaying = false;
        this.tempo = tempo; // beats per minute
        this.intervalID = null;
        this.callback = callback;

    }

    // Convert tempo to interval in seconds
    get interval() {
        return 60.0 / this.tempo;
    }

    start(steps) {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.steps = steps; // Store the steps
            this.scheduleNextStep();
            console.log('Sequencer started with steps:', steps);
        }
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.intervalID);
        this.currentStep = 0;
        console.log('Sequencer stopped.');
    }

    setTempo(bpm) {
        this.tempo = bpm;
        if (this.isPlaying) {
            this.stop();
            this.start();
        }
    }

    scheduleNextStep() {
        const time = this.audioContext.currentTime;
        this.playStep(time + this.interval);
        this.currentStep = (this.currentStep + 1) % 64; // Assuming 64 steps
        this.intervalID = setTimeout(() => this.scheduleNextStep(), this.interval * 1000);
    }

    playStep(time) {
        this.callback(time, this.steps); // Pass the stored steps
        console.log(`Playing step ${this.currentStep} at time ${time}`);
    }
}


export default Sequencer;
