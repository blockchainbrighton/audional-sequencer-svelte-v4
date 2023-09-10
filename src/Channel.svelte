<script>
    import { loadSample } from './audioLoader.js';
    import { steps, muteState } from './store.js';
    import { gainNode } from './audioContext.js';
    export let muteGroup = [[], [], [], []]; // Each mute group is an array of channel IDs

    let loadActive = false;
    let soloActive = false;
    let muteActive = $muteState;
    let channelId = 1; // Initial value, but it will be overwritten by the Svelte markup

    function toggleStep(index) {
        steps.update(currentSteps => {
            currentSteps[index] = !currentSteps[index];
            console.log(`Step ${index + 1} ${currentSteps[index] ? 'activated' : 'deactivated'}`);
            return currentSteps;
        });
    }

    function toggleMuteGroupState(channelId, groupId) {
        if (muteGroup[groupId].includes(channelId)) {
            muteGroup[groupId] = muteGroup[groupId].filter(id => id !== channelId);
            console.log(`Channel ${channelId} removed from Mute Group ${groupId + 1}`);
        } else {
            muteGroup[groupId].push(channelId);
            console.log(`Channel ${channelId} added to Mute Group ${groupId + 1}`);
        }
    }

    function toggleChannelMute() {
        muteActive = !muteActive;
        $muteState = muteActive;
        if (muteActive) {
            gainNode.gain.value = 0;
        } else {
            gainNode.gain.value = 1;
        }
        console.log(`Channel Mute ${muteActive ? 'activated' : 'deactivated'}`);
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
                class:active={soloActive} 
                class="btn-solo"
                on:click={() => {
                    soloActive = !soloActive;
                    console.log(`Solo ${soloActive ? 'activated' : 'deactivated'}`);
                }}
            >
                Solo
            </button>

            <button
                class:active={muteActive} 
                class="btn-channel-mute"
                on:click={toggleChannelMute}
            >
                Channel Mute
            </button>

            <div class="mute-group">
                {#each muteGroup as group, index}
                <button 
                    class:active={group.includes(channelId)} 
                    class="btn-mute-group"
                    on:click={() => toggleMuteGroupState(channelId, index)}
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
        color: white;
    }


    button.active {
        filter: brightness(150%);
    }
   
</style>
