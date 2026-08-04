/* app.js — game logic for the French numbers listening game */
(function () {
  'use strict';

  var FN = window.FrenchNumbers;

  // ---- State ----
  var state = {
    variant: 'fr',      // 'fr' | 'ch'
    mode: 'digit',      // 'digit' | 'words'
    max: 99,
    current: null,      // current number
    answered: false,    // has the current number been resolved?
    score: 0,
    streak: 0,
    best: 0,
    attempts: 0,
    correct: 0,
    rate: 0.9,
    voiceURI: '',       // chosen voice, '' = auto
    timed: false,
    seconds: 10
  };

  // ---- Elements ----
  var el = {
    play: document.getElementById('play'),
    playLabel: document.getElementById('play-label'),
    replay: document.getElementById('replay'),
    form: document.getElementById('answer-form'),
    input: document.getElementById('answer'),
    reveal: document.getElementById('reveal'),
    feedback: document.getElementById('feedback'),
    range: document.getElementById('range'),
    score: document.getElementById('score'),
    streak: document.getElementById('streak'),
    best: document.getElementById('best'),
    accuracy: document.getElementById('accuracy'),
    rate: document.getElementById('rate'),
    rateOut: document.getElementById('rate-out'),
    voice: document.getElementById('voice'),
    voiceNote: document.getElementById('voice-note'),
    timed: document.getElementById('timed'),
    seconds: document.getElementById('seconds'),
    secondsOut: document.getElementById('seconds-out'),
    timerbar: document.getElementById('timerbar'),
    timerfill: document.getElementById('timerfill')
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

  function preferredLang() {
    return state.variant === 'ch' ? 'fr-CH' : 'fr-FR';
  }

  // Pick a voice: explicit choice, else exact lang, else any French, else null.
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
      el.voiceNote.textContent = '⚠ No French voice found on this device. Numbers will still be spoken with the default voice, and the spelling is always revealed.';
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
    if (state.current === null) return;
    var text = FN.numberToFrench(state.current, state.variant);
    if (!synth) return;
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

  // ---- Timer (timed mode) ----
  var timerId = null;
  var timerStart = 0;

  function startTimer() {
    stopTimer();
    if (!state.timed) return;
    el.timerbar.hidden = false;
    el.timerfill.style.transition = 'none';
    el.timerfill.style.transform = 'scaleX(1)';
    // force reflow so the reset applies before animating
    void el.timerfill.offsetWidth;
    var ms = state.seconds * 1000;
    el.timerfill.style.transition = 'transform ' + ms + 'ms linear';
    el.timerfill.style.transform = 'scaleX(0)';
    timerStart = Date.now();
    timerId = setTimeout(function () { onTimeout(); }, ms);
  }

  function stopTimer() {
    if (timerId) { clearTimeout(timerId); timerId = null; }
    el.timerbar.hidden = true;
  }

  function onTimeout() {
    if (state.answered) return;
    resolve(false, true);
  }

  // ---- Game flow ----
  function randInt(max) { return Math.floor(Math.random() * (max + 1)); }

  function nextNumber() {
    state.current = randInt(state.max);
    state.answered = false;
    el.input.value = '';
    el.input.disabled = false;
    el.reveal.disabled = false;
    el.feedback.className = 'feedback';
    el.feedback.textContent = '';
    el.replay.hidden = false;
    el.playLabel.textContent = 'Play number';
    el.input.focus();
    speakCurrent();
    startTimer();
  }

  function expectedAnswer() {
    if (state.mode === 'digit') return String(state.current);
    return FN.numberToFrench(state.current, state.variant);
  }

  function isCorrect(raw) {
    if (state.mode === 'digit') {
      var digits = raw.replace(/\s+/g, '');
      return /^\d+$/.test(digits) && parseInt(digits, 10) === state.current;
    }
    return FN.normalizeFrench(raw) === FN.normalizeFrench(expectedAnswer());
  }

  // resolve the current number: correct = boolean, timedOut = boolean
  function resolve(correct, timedOut) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();
    synth && synth.cancel();
    el.play.classList.remove('is-speaking');
    el.input.disabled = true;
    el.reveal.disabled = true;

    state.attempts++;
    if (correct) {
      state.correct++;
      state.streak++;
      if (state.streak > state.best) state.best = state.streak;
      var points = 10 + Math.min(state.streak - 1, 10); // small streak bonus
      state.score += points;
      el.feedback.className = 'feedback is-ok';
      el.feedback.innerHTML = '✓ Correct! <span class="spelling">' + state.current + ' = ' +
        FN.numberToFrench(state.current, state.variant) + '</span> (+' + points + ')';
    } else {
      state.streak = 0;
      el.feedback.className = 'feedback is-err';
      var lead = timedOut ? '⏱ Time! ' : '✗ ';
      el.feedback.innerHTML = lead + 'The answer was <span class="spelling">' +
        state.current + ' = ' + FN.numberToFrench(state.current, state.variant) + '</span>';
    }
    updateStats();
    el.playLabel.textContent = 'Next number';
  }

  function updateStats() {
    el.score.textContent = state.score;
    el.streak.textContent = state.streak;
    el.best.textContent = state.best;
    el.accuracy.textContent = state.attempts
      ? Math.round((state.correct / state.attempts) * 100) + '%'
      : '—';
  }

  // ---- Event wiring ----
  el.play.addEventListener('click', function () {
    if (state.current === null || state.answered) {
      nextNumber();       // start / advance
    } else {
      speakCurrent();     // replay while unanswered
    }
  });

  el.replay.addEventListener('click', function () {
    if (state.current !== null) speakCurrent();
  });

  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.current === null) { nextNumber(); return; }
    if (state.answered) { nextNumber(); return; }
    var raw = el.input.value.trim();
    if (!raw) return;
    resolve(isCorrect(raw), false);
  });

  el.reveal.addEventListener('click', function () {
    if (state.current === null || state.answered) return;
    resolve(false, false);
  });

  // Segmented buttons (variant + mode)
  document.querySelectorAll('.seg[data-variant]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setSegment('data-variant', btn, function () { state.variant = btn.dataset.variant; });
      updateVoiceNote();
      // re-speak so the change is audible if a number is active & unanswered
      if (state.current !== null && !state.answered) speakCurrent();
    });
  });
  document.querySelectorAll('.seg[data-mode]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setSegment('data-mode', btn, function () {
        state.mode = btn.dataset.mode;
        el.input.setAttribute('inputmode', state.mode === 'digit' ? 'numeric' : 'text');
        el.input.placeholder = state.mode === 'digit' ? 'Type the number…' : 'Type it in French…';
      });
    });
  });

  function setSegment(attr, btn, apply) {
    var group = btn.parentElement.querySelectorAll('[' + attr + ']');
    group.forEach(function (b) { b.setAttribute('aria-checked', 'false'); });
    btn.setAttribute('aria-checked', 'true');
    apply();
  }

  el.range.addEventListener('change', function () {
    state.max = parseInt(el.range.value, 10);
  });

  el.rate.addEventListener('input', function () {
    state.rate = parseFloat(el.rate.value);
    el.rateOut.textContent = state.rate.toFixed(2).replace(/0$/, '') + '×';
  });

  el.voice.addEventListener('change', function () {
    state.voiceURI = el.voice.value;
    updateVoiceNote();
  });

  el.timed.addEventListener('change', function () {
    state.timed = el.timed.checked;
    if (!state.timed) stopTimer();
    else if (state.current !== null && !state.answered) startTimer();
  });

  el.seconds.addEventListener('input', function () {
    state.seconds = parseInt(el.seconds.value, 10);
    el.secondsOut.textContent = state.seconds + 's';
  });

  // Space to replay (when not typing in the input)
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && document.activeElement !== el.input) {
      e.preventDefault();
      if (state.current !== null && !state.answered) speakCurrent();
      else nextNumber();
    }
  });

  // ---- Init ----
  if (synth) {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    // Safari sometimes needs a nudge
    setTimeout(loadVoices, 300);
  } else {
    updateVoiceNote();
  }
  updateStats();
})();
