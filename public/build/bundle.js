
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const steps = writable(Array(64).fill(false));
    const muteState = writable(false); // This will store the global mute state

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    console.log('audioContext initialized in audioContext.js.');

    // Check the mute state immediately after creating the context
    if (get_store_value(muteState)) {
        audioContext.gain.value = 0;
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

    // Create a GainNode for the entire application
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    // Check the mute state immediately after creating the GainNode
    if (get_store_value(muteState)) {
        gainNode.gain.value = 0;
    }

    const audioBuffers = new Map();


    const sampleUrl = "https://ipfs.io/ipfs/QmWuuNy5oRr85QKQvAj2eFK7dZiy6F8SaRD9cFGgqteZfi"; // Hardcoded sample URL

    function loadSample(channelElement, channelIndex, loadSampleButtonElement) {
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

    function getBufferedAudio() {
        return audioBuffers.get(sampleUrl);
    }

    let isPlaying = false;
    let intervalId;
    let currentStep = 1;

    function playSample$1(volume) {
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
            playSample$1(volume);
        }
    }



    function startSequence(steps, initialStep, volume) { 
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
    function pauseSequence() {
        if (isPlaying) {
            clearInterval(intervalId);
            isPlaying = false;
            console.log('Sequence paused');
        }
    }

    function stopSequence() {
        pauseSequence();
        currentStep = 0;
        console.log('Sequence stopped');
    }

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

    /* src/ControlSection.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/ControlSection.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (89:4) {#each muteGroup as group, index}
    function create_each_block$1(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*index*/ ctx[17] + 1 + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[10](/*index*/ ctx[17]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Master ");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(button, "class", "svelte-1716yd8");
    			toggle_class(button, "active", /*group*/ ctx[15]);
    			add_location(button, file$1, 89, 8, 2446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*muteGroup*/ 8) {
    				toggle_class(button, "active", /*group*/ ctx[15]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(89:4) {#each muteGroup as group, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div0;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let label0;
    	let t4;
    	let input0;
    	let t5;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div1;
    	let h3;
    	let t9;
    	let mounted;
    	let dispose;
    	let each_value = /*muteGroup*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Play";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Stop";
    			t3 = space();
    			label0 = element("label");
    			t4 = text("Volume: ");
    			input0 = element("input");
    			t5 = space();
    			label1 = element("label");
    			t6 = text("Tempo: ");
    			input1 = element("input");
    			t7 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Mute Group Masters";
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button0, "class", "play svelte-1716yd8");
    			toggle_class(button0, "active", /*playing*/ ctx[1]);
    			add_location(button0, file$1, 58, 4, 1647);
    			attr_dev(button1, "class", "stop svelte-1716yd8");
    			toggle_class(button1, "active", !/*playing*/ ctx[1]);
    			add_location(button1, file$1, 68, 4, 1849);
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "100");
    			add_location(input0, file$1, 78, 16, 2076);
    			attr_dev(label0, "class", "svelte-1716yd8");
    			add_location(label0, file$1, 77, 4, 2052);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "60");
    			attr_dev(input1, "max", "180");
    			add_location(input1, file$1, 81, 15, 2177);
    			attr_dev(label1, "class", "svelte-1716yd8");
    			add_location(label1, file$1, 80, 4, 2154);
    			attr_dev(div0, "class", "control-section svelte-1716yd8");
    			set_style(div0, "width", "95%");
    			add_location(div0, file$1, 57, 0, 1593);
    			attr_dev(h3, "class", "svelte-1716yd8");
    			add_location(h3, file$1, 87, 4, 2372);
    			attr_dev(div1, "class", "mute-group-master svelte-1716yd8");
    			set_style(div1, "width", "95%");
    			add_location(div1, file$1, 86, 0, 2316);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			append_dev(div0, t3);
    			append_dev(div0, label0);
    			append_dev(label0, t4);
    			append_dev(label0, input0);
    			set_input_value(input0, /*volume*/ ctx[2]);
    			append_dev(div0, t5);
    			append_dev(div0, label1);
    			append_dev(label1, t6);
    			append_dev(label1, input1);
    			set_input_value(input1, /*tempo*/ ctx[0]);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[6], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[7], false, false, false, false),
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[8]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[8]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[9]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[9]),
    					listen_dev(input1, "input", /*handleTempoChange*/ ctx[5], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*playing*/ 2) {
    				toggle_class(button0, "active", /*playing*/ ctx[1]);
    			}

    			if (dirty & /*playing*/ 2) {
    				toggle_class(button1, "active", !/*playing*/ ctx[1]);
    			}

    			if (dirty & /*volume*/ 4) {
    				set_input_value(input0, /*volume*/ ctx[2]);
    			}

    			if (dirty & /*tempo*/ 1) {
    				set_input_value(input1, /*tempo*/ ctx[0]);
    			}

    			if (dirty & /*muteGroup, console*/ 8) {
    				each_value = /*muteGroup*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $steps;
    	validate_store(steps, 'steps');
    	component_subscribe($$self, steps, $$value => $$invalidate(12, $steps = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ControlSection', slots, []);
    	let tempo = 120; // Ensure this is at the top
    	let currentStep = 0; // <-- Reintroduce this line
    	let sequencer = new Sequencer(handleStep, tempo);
    	let playing = false;
    	let volume = 50;

    	// When you're checking or updating the steps, use $steps to access the current value:
    	function togglePlay() {
    		$$invalidate(1, playing = !playing);

    		if (playing) {
    			console.log('Play button pressed');
    			console.log('Starting the sequencer...');
    			startSequence($steps, currentStep, volume); // Use the method from playSequence.js
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<ControlSection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		togglePlay();
    		console.log('Play button clicked');
    	};

    	const click_handler_1 = () => {
    		togglePlay();
    		console.log('Stop button clicked');
    	};

    	function input0_change_input_handler() {
    		volume = to_number(this.value);
    		$$invalidate(2, volume);
    	}

    	function input1_change_input_handler() {
    		tempo = to_number(this.value);
    		$$invalidate(0, tempo);
    	}

    	const click_handler_2 = index => {
    		$$invalidate(3, muteGroup[index] = !muteGroup[index], muteGroup);
    		console.log(`Mute Group Master ${index + 1} clicked`);
    	};

    	$$self.$capture_state = () => ({
    		steps,
    		startSequence,
    		stopSequence,
    		pauseSequence,
    		tempo,
    		currentStep,
    		Sequencer,
    		sequencer,
    		playing,
    		volume,
    		togglePlay,
    		handleTempoChange,
    		handleStep,
    		muteGroup,
    		$steps
    	});

    	$$self.$inject_state = $$props => {
    		if ('tempo' in $$props) $$invalidate(0, tempo = $$props.tempo);
    		if ('currentStep' in $$props) currentStep = $$props.currentStep;
    		if ('sequencer' in $$props) sequencer = $$props.sequencer;
    		if ('playing' in $$props) $$invalidate(1, playing = $$props.playing);
    		if ('volume' in $$props) $$invalidate(2, volume = $$props.volume);
    		if ('muteGroup' in $$props) $$invalidate(3, muteGroup = $$props.muteGroup);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tempo,
    		playing,
    		volume,
    		muteGroup,
    		togglePlay,
    		handleTempoChange,
    		click_handler,
    		click_handler_1,
    		input0_change_input_handler,
    		input1_change_input_handler,
    		click_handler_2
    	];
    }

    class ControlSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ControlSection",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Channel.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src/Channel.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (80:16) {#each muteGroup as group, index}
    function create_each_block_1(ctx) {
    	let button;
    	let t0_value = /*index*/ ctx[19] + 1 + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[12](/*index*/ ctx[19]);
    	}

    	function keydown_handler(...args) {
    		return /*keydown_handler*/ ctx[13](/*index*/ ctx[19], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "btn-mute-group svelte-1a20j48");
    			toggle_class(button, "active", /*group*/ ctx[20]);
    			add_location(button, file, 80, 20, 2590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", click_handler_3, false, false, false, false),
    					listen_dev(button, "keydown", keydown_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*muteGroup*/ 1) {
    				toggle_class(button, "active", /*group*/ ctx[20]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(80:16) {#each muteGroup as group, index}",
    		ctx
    	});

    	return block;
    }

    // (91:12) {#each $steps as step, index}
    function create_each_block(ctx) {
    	let button;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[14](/*index*/ ctx[19]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*step*/ ctx[17] ? 'active btn-step' : 'btn-step') + " svelte-1a20j48"));
    			add_location(button, file, 91, 16, 2984);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_4, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$steps*/ 8 && button_class_value !== (button_class_value = "" + (null_to_empty(/*step*/ ctx[17] ? 'active btn-step' : 'btn-step') + " svelte-1a20j48"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(91:12) {#each $steps as step, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div3;
    	let div2;
    	let button0;
    	let t1;
    	let div1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let div0;
    	let t6;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*muteGroup*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*$steps*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "Load";
    			t1 = space();
    			div1 = element("div");
    			button1 = element("button");
    			button1.textContent = "Solo";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Mute";
    			t5 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button0, "class", "load svelte-1a20j48");
    			toggle_class(button0, "active", /*loadActive*/ ctx[4]);
    			add_location(button0, file, 47, 8, 1470);
    			attr_dev(button1, "class", "btn-solo svelte-1a20j48");
    			toggle_class(button1, "active", /*soloActive*/ ctx[1]);
    			add_location(button1, file, 56, 12, 1737);
    			attr_dev(button2, "class", "btn-mute svelte-1a20j48");
    			toggle_class(button2, "active", /*muteActive*/ ctx[2]);
    			add_location(button2, file, 66, 12, 2060);
    			attr_dev(div0, "class", "mute-group svelte-1a20j48");
    			add_location(div0, file, 77, 12, 2479);
    			attr_dev(div1, "class", "steps svelte-1a20j48");
    			add_location(div1, file, 55, 8, 1705);
    			attr_dev(div2, "class", "controls svelte-1a20j48");
    			add_location(div2, file, 46, 4, 1439);
    			attr_dev(div3, "class", "channel svelte-1a20j48");
    			attr_dev(div3, "data-id", "Channel-1");
    			set_style(div3, "width", "95%");
    			add_location(div3, file, 45, 0, 1373);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, button1);
    			append_dev(div1, t3);
    			append_dev(div1, button2);
    			append_dev(div1, t5);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div0, null);
    				}
    			}

    			append_dev(div1, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[11], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*soloActive*/ 2) {
    				toggle_class(button1, "active", /*soloActive*/ ctx[1]);
    			}

    			if (dirty & /*muteActive*/ 4) {
    				toggle_class(button2, "active", /*muteActive*/ ctx[2]);
    			}

    			if (dirty & /*muteGroup, toggleMute, handleKeydown*/ 193) {
    				each_value_1 = /*muteGroup*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*$steps, toggleStep*/ 40) {
    				each_value = /*$steps*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $muteState;
    	let $steps;
    	validate_store(muteState, 'muteState');
    	component_subscribe($$self, muteState, $$value => $$invalidate(16, $muteState = $$value));
    	validate_store(steps, 'steps');
    	component_subscribe($$self, steps, $$value => $$invalidate(3, $steps = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Channel', slots, []);
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
    		$$invalidate(0, muteGroup[index] = !muteGroup[index], muteGroup);
    		console.log(`Mute Group ${index + 1} ${muteGroup[index] ? 'muted' : 'unmuted'}`);
    	}

    	function handleKeydown(e, index) {
    		if (e.key === 'Enter' || e.key === ' ') {
    			toggleMute(index);
    		}
    	}

    	// Function to handle muting and unmuting using the GainNode
    	function handleMute() {
    		set_store_value(muteState, $muteState = muteActive, $muteState); // Update the global mute state directly

    		if (muteActive) {
    			gainNode.gain.value = 0; // Mute the sound
    		} else {
    			gainNode.gain.value = 1; // Restore the original volume
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Channel> was created with unknown prop '${key}'`);
    	});

    	const click_handler = event => loadSample(event.currentTarget.closest('.channel'), 0, event.target);

    	const click_handler_1 = () => {
    		$$invalidate(1, soloActive = !soloActive);
    		console.log(`Solo ${soloActive ? 'activated' : 'deactivated'}`);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(2, muteActive = !muteActive);
    		handleMute(); // Call the handleMute function when the mute button is clicked
    		console.log(`Mute ${muteActive ? 'activated' : 'deactivated'}`);
    	};

    	const click_handler_3 = index => toggleMute(index);
    	const keydown_handler = (index, e) => handleKeydown(e, index);
    	const click_handler_4 = index => toggleStep(index);

    	$$self.$capture_state = () => ({
    		loadSample,
    		steps,
    		muteState,
    		gainNode,
    		muteGroup,
    		loadActive,
    		soloActive,
    		muteActive,
    		toggleStep,
    		toggleMute,
    		handleKeydown,
    		handleMute,
    		$muteState,
    		$steps
    	});

    	$$self.$inject_state = $$props => {
    		if ('muteGroup' in $$props) $$invalidate(0, muteGroup = $$props.muteGroup);
    		if ('loadActive' in $$props) $$invalidate(4, loadActive = $$props.loadActive);
    		if ('soloActive' in $$props) $$invalidate(1, soloActive = $$props.soloActive);
    		if ('muteActive' in $$props) $$invalidate(2, muteActive = $$props.muteActive);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		muteGroup,
    		soloActive,
    		muteActive,
    		$steps,
    		loadActive,
    		toggleStep,
    		toggleMute,
    		handleKeydown,
    		handleMute,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		keydown_handler,
    		click_handler_4
    	];
    }

    class Channel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Channel",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    function create_fragment(ctx) {
    	let controlsection;
    	let t;
    	let channel;
    	let current;
    	controlsection = new ControlSection({ $$inline: true });
    	channel = new Channel({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(controlsection.$$.fragment);
    			t = space();
    			create_component(channel.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(controlsection, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(channel, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(controlsection.$$.fragment, local);
    			transition_in(channel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(controlsection.$$.fragment, local);
    			transition_out(channel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(controlsection, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(channel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ControlSection, Channel });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
