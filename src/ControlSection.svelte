<script>
    import { steps } from './store.js';
    import { startSequence, stopSequence, pauseSequence } from './playSequence.js';

    let tempo = 120; // Ensure this is at the top
    let currentStep = 0; // <-- Reintroduce this line



   

    import Sequencer from './timeAndSteps.js';
    let sequencer = new Sequencer(handleStep, tempo);

    let playing = false;
    let volume = 50;

    
// When you're checking or updating the steps, use $steps to access the current value:
function togglePlay() {
    playing = !playing;
    if (playing) {
        console.log('Play button pressed');
        console.log('Starting the sequencer...');
        startSequence($steps, currentStep, volume);  // Use the method from playSequence.js
    } else {
        console.log('Stop button pressed');
        console.log('Stopping the sequencer...');
        stopSequence(); // Use the method from playSequence.js
        currentStep = 0; // Reset currentStep when stopping the sequence
    }
}

    function handleTempoChange() {
        sequencer.setTempo(tempo);
        if (playing) {
            console.log('Tempo changed while playing');
        } else {
            console.log('Tempo changed');
        }
    }

    function handleStep(time, steps, currentStep) {
        if (steps[currentStep]) {
            console.log(`Step ${currentStep} played`);
            playSample(volume); // Use playSample from playSequence.js
        }
        return (currentStep + 1) % steps.length; // Return the incremented value
    }


    let muteGroup = [false, false, false, false]; 
</script>




<div class="control-section" style="width: 95%;">
    <button 
        class:active={playing} class="play"
        on:click={() => {
            togglePlay();
            console.log('Play button clicked');
        }}
    >
        Play
    </button>

    <button
        class:active={!playing} class="stop"
        on:click={() => {
            togglePlay();
            console.log('Stop button clicked');
        }}
    >
        Stop  
    </button>
    <label>
        Volume: <input type="range" bind:value={volume} min="0" max="100" />
    </label>
    <label>
        Tempo: <input type="range" bind:value={tempo} min="60" max="180" on:input={handleTempoChange} />
    </label>
</div>

<div class="mute-group-master" style="width: 95%;">
    {#each muteGroup as group, index}
        <button 
            class:active={group}
            on:click={() => {
                muteGroup[index] = !muteGroup[index];
                console.log(`Mute Group ${index + 1} clicked`);
            }}
        >
            Mute Group {index + 1}
        </button>
    {/each}
</div>

<style>
    .control-section {
        display: flex;
        flex-wrap: wrap;
    }

    .control-section > * {
        flex-grow: 1;
        flex-basis: 0;
    }

    .mute-group-master {
        display: flex;
    }

    .mute-group-master button {
        background-color: rgb(179, 2, 2);
        flex: 1;
    }

    button.active {
        filter: brightness(150%); 
    }

    button.play.active {
        background: green; 
    }

    button.stop.active {
        background: red;
    }
</style>
