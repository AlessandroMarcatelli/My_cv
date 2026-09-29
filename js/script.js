/* ==========================================================================
   SCRIPT.JS - Logica Audio, Effetti Interattivi, Tab e Terminale
   ========================================================================== */

let soundEnabled = true;
let isMusicPlaying = false;
let isSynthPlaying = false;
let synthTimeout = null;
let audioCtx = null;

/**
 * Inizializza l'AudioContext WebAudio API
 */
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

/**
 * Sintetizzatore di riserva (Fallback Audio)
 * Genera la melodia di "Road to the West" via WebAudio se l'MP3 fallisce
 */
function playBebopSynth() {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const melody = [
        { freq: 293.66, duration: 1.6 }, // D4
        { freq: 349.23, duration: 1.2 }, // F4
        { freq: 440.00, duration: 1.6 }, // A4
        { freq: 523.25, duration: 2.2 }, // C5
        { freq: 493.88, duration: 1.6 }, // B4
        { freq: 392.00, duration: 1.2 }, // G4
        { freq: 329.63, duration: 2.2 }, // E4
        { freq: 261.63, duration: 2.6 }  // C4
    ];

    let noteIdx = 0;
    isSynthPlaying = true;

    function playNextNote() {
        if (!isSynthPlaying) return;
        const note = melody[noteIdx];
        
        try {
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'triangle'; 
            osc.frequency.setValueAtTime(note.freq, ctx.currentTime);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(750, ctx.currentTime);

            gain.gain.setValueAtTime(0.01, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.duration - 0.05);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + note.duration);
        } catch(e) {
            console.log("Errore riproduzione Synth:", e);
        }

        noteIdx = (noteIdx + 1) % melody.length;
        synthTimeout = setTimeout(playNextNote, note.duration * 1000);
    }

    playNextNote();
}

/**
 * Ferma il sintetizzatore audio
 */
function stopBebopSynth() {
    isSynthPlaying = false;
    if (synthTimeout) {
        clearTimeout(synthTimeout);
        synthTimeout = null;
    }
}

/**
 * Genera effetti sonori sintetizzati per click e beeps
 */
function playSound(type) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'click') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } else if (type === 'beep') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        }
    } catch (e) {
        console.log('Riproduzione audio bloccata dal browser:', e);
    }
}

/**
 * Attiva o disattiva la musica di sottofondo
 */
function toggleMusic() {
    playSound('click');
    const audio = document.getElementById('bgMusic');
    const btn = document.getElementById('musicToggleBtn');
    const icon = document.getElementById('musicIcon');
    const text = document.getElementById('musicText');

    if (isMusicPlaying || isSynthPlaying) {
        audio.pause();
        stopBebopSynth();
        isMusicPlaying = false;
        icon.className = "fas fa-music text-bebop-amber";
        text.innerText = "MUSIC: OFF";
        btn.classList.remove('animate-pulse');
    } else {
        audio.volume = 0.35;
        audio.play().then(() => {
            isMusicPlaying = true;
            icon.className = "fas fa-compact-disc fa-spin text-bebop-gold";
            text.innerText = "NOW PLAYING: SEATBELTS - ROAD TO THE WEST";
            btn.classList.add('animate-pulse');
        }).catch(err => {
            console.log("Musica esterna non raggiungibile, attivazione synth WebAudio fallback...", err);
            playBebopSynth();
            icon.className = "fas fa-compact-disc fa-spin text-bebop-gold";
            text.innerText = "NOW PLAYING: ROAD TO THE WEST (SYNTH)";
            btn.classList.add('animate-pulse');
        });
    }
}

/**
 * Attiva o disattiva gli effetti sonori (SFX)
 */
function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('soundIcon');
    const text = document.getElementById('soundText');
    if (soundEnabled) {
        icon.className = "fas fa-volume-up text-bebop-green";
        text.innerText = "SFX: ON";
        playSound('beep');
    } else {
        icon.className = "fas fa-volume-mute text-bebop-red";
        text.innerText = "SFX: OFF";
    }
}

/**
 * Attiva o disattiva l'overlay dell'effetto CRT
 */
function toggleCRT() {
    playSound('click');
    const crt = document.getElementById('crtOverlay');
    crt.style.display = crt.style.display === 'none' ? 'block' : 'none';
}

/**
 * Gestisce la navigazione tra le schede (Tab)
 */
function switchTab(tabKey) {
    playSound('click');
    
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn font-orbitron font-extrabold text-sm px-5 py-2.5 bg-bebop-panel text-bebop-dim border-t-2 border-x-2 border-transparent hover:text-white tracking-wider uppercase transition-all";
    });

    const activeBtn = document.getElementById(`tab-${tabKey}`);
    if (tabKey === 'exp') {
        activeBtn.className = "tab-btn active font-orbitron font-extrabold text-sm px-5 py-2.5 bg-bebop-red text-black border-t-2 border-x-2 border-bebop-red tracking-wider uppercase transition-all";
    } else if (tabKey === 'skills') {
        activeBtn.className = "tab-btn active font-orbitron font-extrabold text-sm px-5 py-2.5 bg-bebop-cyan text-black border-t-2 border-x-2 border-bebop-cyan tracking-wider uppercase transition-all";
    } else {
        activeBtn.className = "tab-btn active font-orbitron font-extrabold text-sm px-5 py-2.5 bg-bebop-green text-black border-t-2 border-x-2 border-bebop-green tracking-wider uppercase transition-all";
    }

    document.getElementById(`content-${tabKey}`).classList.remove('hidden');
}

/**
 * Copia l'indirizzo email negli appunti
 */
function copyEmail() {
    playSound('beep');
    const email = "ale.marcatelli@gmail.com";
    
    const tempInput = document.createElement("input");
    tempInput.value = email;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);

    const toast = document.createElement("div");
    toast.className = "fixed bottom-5 right-5 bg-bebop-cyan text-black font-mono font-bold px-4 py-2 text-xs shadow-lg z-50 animate-bounce";
    toast.innerText = "EMAIL COPIATA NELLE NOTE!";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}
