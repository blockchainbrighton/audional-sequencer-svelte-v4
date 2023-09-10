<script>
    import { loadSample } from './audioLoader.js';
    import { steps, muteState } from './store.js'; // <-- Import muteState
    import { gainNode } from './audioManager.js';


  
    let muteGroup = [false, false, false, false];
    let loadActive = false;
    let soloActive = false;
    let muteActive = $muteState; // Bind local variable to global state


    function toggleStep(index) {
        steps.update(currentSteps => {
            currentSteps[index] = !currentSteps[index];
            console.log(`Step ${index + 1} ${currentSteps[index] ? 'activated' : 'deactivated'}`);
            return currentSteps;
        });
    }

    function toggleMute(index) {
        muteGroup[index] = !muteGroup[index];
        console.log(`Mute Group ${index + 1} ${muteGroup[index] ? 'muted' : 'unmuted'}`);
    }

    function handleKeydown(e, index) {
        if (e.key === 'Enter' || e.key === ' ') {
            toggleMute(index);
        } 
    }

    // Function to handle muting and unmuting using the GainNode
    function handleMute() {
        $muteState = muteActive; // Update the global mute state directly
        if (muteActive) {
            gainNode.gain.value = 0; // Mute the sound
        } else {
            gainNode.gain.value = 1; // Restore the original volume
        }
    }
</script>

<div class="channel" data-id="Channel-1" style="width: 95%;">
    <div class="controls">
        <button
            class:active={loadActive}
            class="load"
            on:click={(event) => loadSample(event.currentTarget.closest('.channel'), 0, event.target)}
        >
            Load
        </button>
       
        <div class="steps">
            <button
                class:active={soloActive} class="btn-solo"
                on:click={() => {
                    soloActive = !soloActive;
                    console.log(`Solo ${soloActive ? 'activated' : 'deactivated'}`);
                }}  
            >
                Solo
            </button>

            <button
                class:active={muteActive} class="btn-mute"
                on:click={() => {
                    muteActive = !muteActive;
                    handleMute(); // Call the handleMute function when the mute button is clicked
                    console.log(`Mute ${muteActive ? 'activated' : 'deactivated'}`);
                }}
            >
                Mute
            </button>

            <div class="mute-group">
                {#each muteGroup as group, index}
                    <button 
                        class:active={group} class="btn-mute-group"
                        on:click={() => toggleMute(index)}
                        on:keydown={(e) => handleKeydown(e, index)}
                    >
                        {index + 1}
                    </button>
                {/each}
            </div>

            {#each $steps as step, index}
                <button  
                    class={step ? 'active btn-step' : 'btn-step'}
                    on:click={() => toggleStep(index)}
                >
                </button>
            {/each}
        </div>
    </div>
</div>

<style>
    .controls {
        display: flex;
        flex-wrap: wrap;
    }

    .controls button {
        flex-grow: 1; 
        flex-basis: 0;
    }

    .channel > div {
        display: flex;
        align-items: center;
    }

    .channel {
        display: flex; 
        flex-wrap: wrap;
    }

    .channel button, .channel .mute-group {
        flex-grow: 1;
        flex-basis: 0;
    }

    .steps {
        display: flex;
        gap: 5px;
    }

    .steps button.btn-step.active {
        background-color: green;
    }

    .steps button.btn-solo {
        background-color: rgb(176, 176, 4);
    }

    .steps button.btn-mute, .steps button.btn-mute-group.active {
        background-color: rgb(179, 2, 2);
    }

    button.active {
        filter: brightness(150%);
    }
</style>
