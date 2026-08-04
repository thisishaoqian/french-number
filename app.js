/* app.js — 10-round timed French numbers listening game */
(function () {
  'use strict';

  var FN = window.FrenchNumbers;
  var ROUNDS = 10;

  // ---- State ----
  var state = {
    variant: 'fr',      // 'fr' | 'ch'
    mode: 'digit',      // 'digit' | 'words'
    max: 99,
    rate: 0.9,
    voiceURI: '',       // '' = auto

    active: false,      // is a game in progress?
    round: 0,           // current round number (1..ROUNDS)
    current: null,      // current number
    answered: false,    // has the current round been resolved?
    correct: 0,         // correct answers so far
    results: [],        // [{round, n, correct}]
    startTime: 0        // ms timestamp when the game began
  };

  // ---- Elements ----
  var el = {
    play: document.getElementById('play'),
    playLabel: document.getElementById('play-label'),
    form: document.getElementById('answer-form'),
    input: document.getElementById('answer'),
    check: document.getElementById('check'),
    reveal: document.getElementById('reveal'),
    feedback: document.getElementById('feedback'),
    stage: document.getElementById('stage'),
    range: document.getElementById('range'),
    round: document.getElementById('round'),
    correct: document.getElementById('correct'),
    time: document.getElementById('time'),
    results: document.getElementById('results'),
    rCorrect: document.getElementById('r-correct'),
    rTime: document.getElementById('r-time'),
    rAvg: document.getElementById('r-avg'),
    rList: document.getElementById('r-list'),
    playagain: document.getElementById('playagain'),
    rate: document.getElementById('rate'),
    rateOut: document.getElementById('rate-out'),
    voice: document.getElementById('voice'),
    voiceNote: document.getElementById('voice-note')
  };

  // ---- Speech ----
  var voices = [];
  var synth = window.speechSynthesis;

  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices().filter(function (v) { return /^fr(-|_|$)/i.test(v.lang); });
    renderVoiceOptions();
    updateVoiceNote();
  }

  function renderVoiceOptions() {
    el.voice.innerHTML = '';
    var auto = document.createElement('option');
    auto.value = '';
    auto.textContent = 'Automatic (best match)';
    el.voice.appendChild(auto);
    voices.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v.voiceURI;
      o.textContent = v.name + ' (' + v.lang + ')';
      el.voice.appendChild(o);
    });
    el.voice.value = state.voiceURI;
  }

  function preferredLang() { return state.variant === 'ch' ? 'fr-CH' : 'fr-FR'; }

  function pickVoice() {
    if (state.voiceURI) {
      var chosen = voices.find(function (v) { return v.voiceURI === state.voiceURI; });
      if (chosen) return chosen;
    }
    var want = preferredLang().toLowerCase();
    var exact = voices.find(function (v) { return v.lang.toLowerCase() === want; });
    if (exact) return exact;
    return voices[0] || null;
  }

  function updateVoiceNote() {
    if (!synth) {
      el.voiceNote.textContent = '⚠ Your browser does not support speech synthesis. The spelling is shown instead.';
      return;
    }
    if (voices.length === 0) {
      el.voiceNote.textContent = '⚠ No French voice found on this device. Numbers are spoken with the default voice, and the spelling is always revealed.';
      return;
    }
    var v = pickVoice();
    var note = 'Using voice: ' + (v ? v.name + ' (' + v.lang + ')' : 'default');
    if (state.variant === 'ch' && v && !/ch/i.test(v.lang)) {
      note += ' — no Swiss (fr-CH) voice installed, so a French voice reads the Swiss words (septante, huitante, nonante).';
    }
    el.voiceNote.textContent = note;
  }

  function speakCurrent() {
    if (state.current === null || !synth) return;
    var text = FN.numberToFrench(state.current, state.variant);
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice();
    if (v) u.voice = v;
    u.lang = v ? v.lang : preferredLang();
    u.rate = state.rate;
    u.onstart = function () { el.play.classList.add('is-speaking'); };
    u.onend = function () { el.play.classList.remove('is-speaking'); };
    u.onerror = function () { el.play.classList.remove('is-speaking'); };
    synth.speak(u);
  }

  // ---- Clock ----
  var clockId = null;
  function fmt(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }
  function startClock() {
    stopClock();
    clockId = setInterval(function () {
      el.time.textContent = fmt(Date.now() - state.startTime);
    }, 250);
  }
  function stopClock() { if (clockId) { clearInterval(clockId); clockId = null; } }

  // ---- Game flow ----
  function randInt(max) { return Math.floor(Math.random() * (max + 1)); }

  function startGame() {
    state.active = true;
    state.round = 0;
    state.correct = 0;
    state.results = [];
    state.startTime = Date.now();
    el.results.hidden = true;
    el.stage.hidden = false;
    el.correct.textContent = '0';
    el.time.textContent = '0:00';
    el.playLabel.textContent = 'Replay';
    startClock();
    nextRound();
  }

  function nextRound() {
    state.round++;
    if (state.round > ROUNDS) { endGame(); return; }
    state.current = randInt(state.max);
    state.answered = false;
    el.round.textContent = state.round + ' / ' + ROUNDS;
    el.input.value = '';
    el.input.disabled = false;
    el.reveal.disabled = false;
    el.check.textContent = 'Check';
    el.feedback.className = 'feedback';
    el.feedback.textContent = '';
    el.input.focus();
    speakCurrent();
  }

  function expectedAnswer() {
    return state.mode === 'digit'
      ? String(state.current)
      : FN.numberToFrench(state.current, state.variant);
  }

  function isCorrect(raw) {
    if (state.mode === 'digit') {
      var digits = raw.replace(/\s+/g, '');
      return /^\d+$/.test(digits) && parseInt(digits, 10) === state.current;
    }
    return FN.normalizeFrench(raw) === FN.normalizeFrench(expectedAnswer());
  }

  function resolveRound(correct) {
    if (state.answered) return;
    state.answered = true;
    synth && synth.cancel();
    el.play.classList.remove('is-speaking');
    el.input.disabled = true;
    el.reveal.disabled = true;

    state.results.push({ round: state.round, n: state.current, correct: correct });
    var spelling = FN.numberToFrench(state.current, state.variant);
    if (correct) {
      state.correct++;
      el.feedback.className = 'feedback is-ok';
      el.feedback.innerHTML = '✓ Correct! <span class="spelling">' + state.current + ' = ' + spelling + '</span>';
    } else {
      el.feedback.className = 'feedback is-err';
      el.feedback.innerHTML = '✗ The answer was <span class="spelling">' + state.current + ' = ' + spelling + '</span>';
    }
    el.correct.textContent = state.correct;
    el.check.textContent = state.round === ROUNDS ? 'See results' : 'Next';
  }

  function endGame() {
    state.active = false;
    state.answered = true;
    stopClock();
    var totalMs = Date.now() - state.startTime;

    el.rCorrect.textContent = state.correct;
    el.rTime.textContent = fmt(totalMs);
    el.rAvg.textContent = (totalMs / ROUNDS / 1000).toFixed(1) + 's';
    el.time.textContent = fmt(totalMs);

    el.rList.innerHTML = '';
    state.results.forEach(function (r) {
      var li = document.createElement('li');
      li.className = r.correct ? 'ok' : 'err';
      li.innerHTML = '<span class="r-mark">' + (r.correct ? '✓' : '✗') + '</span>' +
        '<span class="r-num">' + r.n + '</span>' +
        '<span class="r-word">' + FN.numberToFrench(r.n, state.variant) + '</span>';
      el.rList.appendChild(li);
    });

    el.stage.hidden = true;
    el.results.hidden = false;
  }

  // ---- Events ----
  el.play.addEventListener('click', function () {
    if (!state.active) { startGame(); return; }
    speakCurrent();                       // replay during a game
  });

  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!state.active) { startGame(); return; }
    if (state.answered) { nextRound(); return; }  // advance (or end)
    var raw = el.input.value.trim();
    if (!raw) return;
    resolveRound(isCorrect(raw));
  });

  el.reveal.addEventListener('click', function () {
    if (!state.active || state.answered) return;
    resolveRound(false);
  });

  el.playagain.addEventListener('click', startGame);

  // Segmented controls
  document.querySelectorAll('.seg[data-variant]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setSegment(btn, 'variant');
      state.variant = btn.dataset.variant;
      updateVoiceNote();
      if (state.active && !state.answered) speakCurrent();
    });
  });
  document.querySelectorAll('.seg[data-mode]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setSegment(btn, 'mode');
      state.mode = btn.dataset.mode;
      el.input.setAttribute('inputmode', state.mode === 'digit' ? 'numeric' : 'text');
      if (!state.active) el.input.placeholder = 'Press Start to begin…';
    });
  });
  function setSegment(btn, kind) {
    btn.parentElement.querySelectorAll('.seg').forEach(function (b) { b.setAttribute('aria-checked', 'false'); });
    btn.setAttribute('aria-checked', 'true');
  }

  el.range.addEventListener('change', function () { state.max = parseInt(el.range.value, 10); });

  el.rate.addEventListener('input', function () {
    state.rate = parseFloat(el.rate.value);
    el.rateOut.textContent = (Math.round(state.rate * 100) / 100) + '×';
  });

  el.voice.addEventListener('change', function () {
    state.voiceURI = el.voice.value;
    updateVoiceNote();
  });

  // Space = replay (when not typing)
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && document.activeElement !== el.input) {
      e.preventDefault();
      if (state.active && !state.answered) speakCurrent();
    }
  });

  // ---- Init ----
  if (synth) {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    setTimeout(loadVoices, 300);
  } else {
    updateVoiceNote();
  }
})();
