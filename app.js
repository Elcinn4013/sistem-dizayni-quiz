/**
 * Sistem Dizaynı - İmtahan Quiz Sistemi
 * Shadcn UI Konseptində Minimalist və Sadə Dizayn
 */

(function () {
  'use strict';

  // State Management
  const state = {
    allQuestions: typeof QUESTIONS_DATA !== 'undefined' ? QUESTIONS_DATA : [],
    currentView: 'setup', // 'setup', 'quiz', 'result', 'bank'
    config: {
      rangeStart: 1,
      rangeEnd: 240,
      questionCount: 50,
      mode: 'practice', // 'practice' or 'exam'
      instantFeedback: true, // dynamic live right/wrong checking
      shuffleQuestions: true,
      shuffleOptions: true,
      enableTimer: true,
      timerMinutes: 50
    },
    quiz: {
      questions: [],
      currentIndex: 0,
      userAnswers: {},
      flagged: {},
      startTime: null,
      endTime: null,
      timerInterval: null,
      remainingSeconds: 0
    },
    reviewFilter: 'all' // 'all', 'wrong', 'correct', 'unanswered'
  };

  // DOM Elements
  const DOM = {
    // Screens
    screenSetup: document.getElementById('screen-setup'),
    screenQuiz: document.getElementById('screen-quiz'),
    screenResult: document.getElementById('screen-result'),
    screenBank: document.getElementById('screen-bank'),

    // Setup Form
    rangePresetBtns: document.querySelectorAll('.range-preset-btn'),
    inputRangeStart: document.getElementById('range-start'),
    inputRangeEnd: document.getElementById('range-end'),
    rangeCountBadge: document.getElementById('range-count-badge'),
    countPresetBtns: document.querySelectorAll('.count-preset-btn'),
    inputCustomCount: document.getElementById('custom-count'),
    modeCards: document.querySelectorAll('.mode-item'),
    switchTimer: document.getElementById('switch-timer'),
    timerSettingsRow: document.getElementById('timer-settings-row'),
    inputTimerMinutes: document.getElementById('timer-minutes'),
    switchInstantFeedback: document.getElementById('switch-instant-feedback'),
    btnStartQuiz: document.getElementById('btn-start-quiz'),

    // Quiz Elements
    quizHeaderMeta: document.getElementById('quiz-header-meta'),
    quizInstantCheck: document.getElementById('quiz-instant-check'),
    quizTimerBox: document.getElementById('quiz-timer-box'),
    quizTimerText: document.getElementById('quiz-timer-text'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    qNumTag: document.getElementById('q-num-tag'),
    qOrigNumTag: document.getElementById('q-orig-num-tag'),
    btnFlagQuestion: document.getElementById('btn-flag-question'),
    flagText: document.getElementById('flag-text'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    practiceFeedback: document.getElementById('practice-feedback'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    btnOpenPalette: document.getElementById('btn-open-palette'),
    btnFinishQuiz: document.getElementById('btn-finish-quiz'),

    // Palette Modal
    paletteModal: document.getElementById('palette-modal'),
    paletteGrid: document.getElementById('palette-grid'),
    btnClosePalette: document.getElementById('btn-close-palette'),

    // Confirm Finish Modal
    confirmModal: document.getElementById('confirm-modal'),
    confirmText: document.getElementById('confirm-modal-text'),
    btnConfirmCancel: document.getElementById('btn-confirm-cancel'),
    btnCloseConfirm: document.getElementById('btn-close-confirm'),
    btnConfirmSubmit: document.getElementById('btn-confirm-submit'),

    // Result Elements
    resultScoreNum: document.getElementById('result-score-num'),
    resultScoreTotal: document.getElementById('result-score-total'),
    resultPercentage: document.getElementById('result-percentage'),
    resultTitle: document.getElementById('result-title'),
    resultMsg: document.getElementById('result-msg'),
    statCorrect: document.getElementById('stat-correct'),
    statWrong: document.getElementById('stat-wrong'),
    statUnanswered: document.getElementById('stat-unanswered'),
    statTime: document.getElementById('stat-time'),
    btnRestartSame: document.getElementById('btn-restart-same'),
    btnChangeSettings: document.getElementById('btn-change-settings'),
    btnFilterReviewBtns: document.querySelectorAll('.review-filter-btn'),
    reviewList: document.getElementById('review-list'),

    // Question Bank Elements
    bankSearchInput: document.getElementById('bank-search-input'),
    bankTotalBadge: document.getElementById('bank-total-badge'),
    bankListContainer: document.getElementById('bank-list-container'),
    btnBackFromBank: document.getElementById('btn-back-from-bank'),
    btnOpenBankNav: document.getElementById('btn-open-bank-nav'),

    // Header Controls
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeIcon: document.getElementById('theme-icon'),
    btnHomeBrand: document.getElementById('btn-home-brand')
  };

  // Helper Functions
  function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Range and Count Validations
  function updateRangeState() {
    let start = parseInt(DOM.inputRangeStart.value, 10) || 1;
    let end = parseInt(DOM.inputRangeEnd.value, 10) || 240;

    if (start < 1) start = 1;
    if (start > 240) start = 240;
    if (end < 1) end = 1;
    if (end > 240) end = 240;

    if (start > end) {
      end = start;
    }

    DOM.inputRangeStart.value = start;
    DOM.inputRangeEnd.value = end;

    state.config.rangeStart = start;
    state.config.rangeEnd = end;

    const availableCount = (end - start + 1);
    DOM.rangeCountBadge.textContent = `Seçilmiş aralıqda ${availableCount} sual mövcuddur (Sual ${start} – ${end})`;

    // Check custom question count
    let desiredCount = parseInt(DOM.inputCustomCount.value, 10) || 50;
    if (desiredCount > availableCount) {
      desiredCount = availableCount;
      DOM.inputCustomCount.value = desiredCount;
    }
    state.config.questionCount = desiredCount;

    // Highlight matching preset button
    DOM.rangePresetBtns.forEach(btn => {
      const bStart = parseInt(btn.dataset.start, 10);
      const bEnd = parseInt(btn.dataset.end, 10);
      btn.classList.toggle('active', bStart === start && bEnd === end);
    });

    // Highlight matching count button
    DOM.countPresetBtns.forEach(btn => {
      const cnt = btn.dataset.count;
      if (cnt === 'all' && desiredCount === availableCount) {
        btn.classList.add('active');
      } else if (parseInt(cnt, 10) === desiredCount) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Build Quiz Session
  function buildQuizSession() {
    const { rangeStart, rangeEnd, questionCount, mode, enableTimer, timerMinutes } = state.config;

    // Filter questions strictly within chosen range
    const inRange = state.allQuestions.filter(q => q.id >= rangeStart && q.id <= rangeEnd);
    if (inRange.length === 0) {
      alert('Seçilmiş aralıqda sual tapılmadı.');
      return false;
    }

    // Pick random N questions from range
    const shuffledPool = shuffleArray(inRange);
    const countToPick = Math.min(questionCount, shuffledPool.length);
    const selectedQuestions = shuffledPool.slice(0, countToPick);

    // Prepare each question with SHUFFLED options (A, B, C, D, E)
    state.quiz.questions = selectedQuestions.map((q) => {
      const rawOptions = q.options.map((optText, origIdx) => ({
        text: optText,
        isCorrect: (origIdx === q.correctIndex)
      }));

      // Shuffle options completely
      const shuffledOpts = shuffleArray(rawOptions);

      return {
        id: q.id,
        question: q.question,
        options: shuffledOpts,
        correctIndex: shuffledOpts.findIndex(o => o.isCorrect)
      };
    });

    state.quiz.currentIndex = 0;
    state.quiz.userAnswers = {};
    state.quiz.flagged = {};
    state.quiz.startTime = Date.now();
    state.quiz.endTime = null;

    // Timer setup
    if (state.quiz.timerInterval) {
      clearInterval(state.quiz.timerInterval);
      state.quiz.timerInterval = null;
    }

    if (enableTimer && mode === 'exam') {
      DOM.quizTimerBox.style.display = 'block';
      state.quiz.remainingSeconds = timerMinutes * 60;
      updateTimerDisplay();

      state.quiz.timerInterval = setInterval(() => {
        state.quiz.remainingSeconds--;
        updateTimerDisplay();

        if (state.quiz.remainingSeconds <= 0) {
          clearInterval(state.quiz.timerInterval);
          state.quiz.timerInterval = null;
          alert('Vaxt başa çatdı. Test avtomatik yekunlaşdırılır.');
          finishQuiz();
        }
      }, 1000);
    } else {
      DOM.quizTimerBox.style.display = 'none';
    }

    return true;
  }

  function updateTimerDisplay() {
    const sec = Math.max(0, state.quiz.remainingSeconds);
    DOM.quizTimerText.textContent = formatTime(sec);
    DOM.quizTimerBox.classList.toggle('urgent', sec <= 300);
  }

  // Render Current Question
  function renderQuestion() {
    const qIndex = state.quiz.currentIndex;
    const qData = state.quiz.questions[qIndex];
    const totalQ = state.quiz.questions.length;
    const showFeedback = state.config.instantFeedback;
    const hasAnswered = state.quiz.userAnswers.hasOwnProperty(qIndex);
    const selectedOptIdx = state.quiz.userAnswers[qIndex];

    // Meta tags
    DOM.qNumTag.textContent = `Sual ${qIndex + 1} / ${totalQ}`;
    DOM.qOrigNumTag.textContent = `№ ${qData.id}`;

    // Progress bar
    const progressPercent = ((qIndex + 1) / totalQ) * 100;
    DOM.progressBarFill.style.width = `${progressPercent}%`;

    // Flag button text & state
    const isFlagged = Boolean(state.quiz.flagged[qIndex]);
    DOM.flagText.textContent = isFlagged ? 'İşarələnib' : 'İşarələ';
    DOM.btnFlagQuestion.classList.toggle('btn-secondary', isFlagged);
    DOM.btnFlagQuestion.classList.toggle('btn-outline', !isFlagged);

    // Question text
    DOM.questionText.textContent = qData.question;

    // Options rendering
    DOM.optionsContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D', 'E'];

    qData.options.forEach((opt, optIdx) => {
      const optDiv = document.createElement('div');
      optDiv.className = 'option-item';
      optDiv.dataset.index = optIdx;

      const letterSpan = document.createElement('span');
      letterSpan.className = 'option-letter';
      letterSpan.textContent = letters[optIdx];

      const textSpan = document.createElement('span');
      textSpan.className = 'option-text';
      textSpan.textContent = opt.text;

      optDiv.appendChild(letterSpan);
      optDiv.appendChild(textSpan);

      // Selected state
      if (hasAnswered && selectedOptIdx === optIdx) {
        optDiv.classList.add('selected');
      }

      // Live feedback styling
      if (showFeedback && hasAnswered) {
        if (opt.isCorrect) {
          optDiv.classList.add('correct');
        } else if (selectedOptIdx === optIdx) {
          optDiv.classList.add('wrong');
        }
      }

      optDiv.addEventListener('click', () => {
        selectOption(optIdx);
      });

      DOM.optionsContainer.appendChild(optDiv);
    });

    // Instant Feedback Banner
    if (showFeedback && hasAnswered) {
      DOM.practiceFeedback.style.display = 'flex';
      const isCorrect = (selectedOptIdx === qData.correctIndex);
      if (isCorrect) {
        DOM.practiceFeedback.className = 'feedback-banner success';
        DOM.practiceFeedback.innerHTML = `<span>Doğru cavabdır.</span>`;
      } else {
        const correctLetter = letters[qData.correctIndex];
        DOM.practiceFeedback.className = 'feedback-banner danger';
        DOM.practiceFeedback.innerHTML = `<span>Səhvdir. Düzgün variant: <strong>${correctLetter}) ${qData.options[qData.correctIndex].text}</strong></span>`;
      }
    } else {
      DOM.practiceFeedback.style.display = 'none';
    }

    // Navigation buttons state
    DOM.btnPrev.disabled = (qIndex === 0);
    DOM.btnNext.textContent = (qIndex === totalQ - 1) ? 'Baxış / Bitir' : 'Növbəti';
  }

  // Select Option
  function selectOption(optIdx) {
    const qIndex = state.quiz.currentIndex;
    state.quiz.userAnswers[qIndex] = optIdx;
    renderQuestion();
  }

  // Navigate to Question
  function goToQuestion(index) {
    if (index >= 0 && index < state.quiz.questions.length) {
      state.quiz.currentIndex = index;
      renderQuestion();
    }
  }

  // Question Palette Grid Modal
  function openPalette() {
    DOM.paletteGrid.innerHTML = '';
    const totalQ = state.quiz.questions.length;
    const showFeedback = state.config.instantFeedback;

    for (let i = 0; i < totalQ; i++) {
      const btn = document.createElement('button');
      btn.className = 'palette-cell';
      btn.textContent = (i + 1);

      if (i === state.quiz.currentIndex) {
        btn.classList.add('current');
      }

      if (state.quiz.userAnswers.hasOwnProperty(i)) {
        if (showFeedback) {
          const userPick = state.quiz.userAnswers[i];
          const isRight = (userPick === state.quiz.questions[i].correctIndex);
          btn.classList.add(isRight ? 'correct-cell' : 'wrong-cell');
        } else {
          btn.classList.add('answered');
        }
      }

      if (state.quiz.flagged[i]) {
        btn.classList.add('flagged');
      }

      btn.addEventListener('click', () => {
        goToQuestion(i);
        closePalette();
      });

      DOM.paletteGrid.appendChild(btn);
    }

    DOM.paletteModal.classList.add('active');
  }

  function closePalette() {
    DOM.paletteModal.classList.remove('active');
  }

  // Finish Quiz Dialog & Calculation
  function askFinishQuiz() {
    const totalQ = state.quiz.questions.length;
    const answeredCount = Object.keys(state.quiz.userAnswers).length;
    const unansweredCount = totalQ - answeredCount;

    if (unansweredCount > 0) {
      DOM.confirmText.innerHTML = `Siz <strong>${totalQ}</strong> sualdan <strong>${answeredCount}</strong> dənəsini cavablandırmısınız.<br><span style="color:#d97706; font-weight:500;">${unansweredCount} sual hələ cavabsız qalıb.</span><br><br>Testi tamamlamaq istəyirsiniz?`;
    } else {
      DOM.confirmText.innerHTML = `Bütün <strong>${totalQ}</strong> sual cavablandırılıb.<br>Testi tamamlamaq istəyirsiniz?`;
    }

    DOM.confirmModal.classList.add('active');
  }

  function finishQuiz() {
    if (state.quiz.timerInterval) {
      clearInterval(state.quiz.timerInterval);
      state.quiz.timerInterval = null;
    }
    state.quiz.endTime = Date.now();
    DOM.confirmModal.classList.remove('active');
    closePalette();

    calculateAndShowResults();
  }

  function calculateAndShowResults() {
    const totalQ = state.quiz.questions.length;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    state.quiz.questions.forEach((q, idx) => {
      if (!state.quiz.userAnswers.hasOwnProperty(idx)) {
        unansweredCount++;
      } else if (state.quiz.userAnswers[idx] === q.correctIndex) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const percent = Math.round((correctCount / totalQ) * 100);
    const elapsedSeconds = Math.round(((state.quiz.endTime || Date.now()) - state.quiz.startTime) / 1000);

    DOM.resultScoreNum.textContent = correctCount;
    DOM.resultScoreTotal.textContent = `/ ${totalQ}`;
    DOM.resultPercentage.textContent = `${percent}% Düzgünlük`;

    DOM.statCorrect.textContent = correctCount;
    DOM.statWrong.textContent = wrongCount;
    DOM.statUnanswered.textContent = unansweredCount;
    DOM.statTime.textContent = formatTime(elapsedSeconds);

    if (percent >= 90) {
      DOM.resultTitle.textContent = 'Əla Nəticə';
      DOM.resultMsg.textContent = 'Mövzunu tam mənimsəmisiniz.';
    } else if (percent >= 70) {
      DOM.resultTitle.textContent = 'Yaxşı Nəticə';
      DOM.resultMsg.textContent = 'Əsas prinsipləri bilirsiniz, səhvlərinizi nəzərdən keçirin.';
    } else if (percent >= 50) {
      DOM.resultTitle.textContent = 'Kafi Nəticə';
      DOM.resultMsg.textContent = 'Test materialı üzərində əlavə məşq etməyiniz tövsiyə olunur.';
    } else {
      DOM.resultTitle.textContent = 'Qeyri-kafi Nəticə';
      DOM.resultMsg.textContent = 'Sualları təkrar oxuyun və yenidən sınaqdan keçin.';
    }

    state.reviewFilter = 'all';
    DOM.btnFilterReviewBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === 'all');
    });

    renderReviewList();
    switchView('result');
  }

  // Render Detailed Review List
  function renderReviewList() {
    DOM.reviewList.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D', 'E'];

    state.quiz.questions.forEach((q, idx) => {
      const hasAnswered = state.quiz.userAnswers.hasOwnProperty(idx);
      const userPick = state.quiz.userAnswers[idx];
      const isCorrect = (hasAnswered && userPick === q.correctIndex);
      const isWrong = (hasAnswered && userPick !== q.correctIndex);
      const isUnanswered = !hasAnswered;

      // Filter check
      if (state.reviewFilter === 'wrong' && !isWrong) return;
      if (state.reviewFilter === 'correct' && !isCorrect) return;
      if (state.reviewFilter === 'unanswered' && !isUnanswered) return;

      const item = document.createElement('div');
      item.className = 'review-item ' + (isCorrect ? 'is-correct' : (isWrong ? 'is-wrong' : 'is-unanswered'));

      let badgeHtml = '';
      if (isCorrect) {
        badgeHtml = `<span class="badge" style="color:var(--success-text); border-color:var(--success-border); background-color:var(--success-bg);">Doğru</span>`;
      } else if (isWrong) {
        badgeHtml = `<span class="badge" style="color:var(--danger-text); border-color:var(--danger-border); background-color:var(--danger-bg);">Səhv</span>`;
      } else {
        badgeHtml = `<span class="badge badge-outline">Cavabsız</span>`;
      }

      let optsHtml = '';
      q.options.forEach((opt, optIdx) => {
        let optCls = 'review-opt-line';
        let markText = '';
        if (optIdx === q.correctIndex) {
          optCls += ' is-correct-ans';
          markText = ' (Düzgün cavab)';
        }
        if (hasAnswered && optIdx === userPick && !opt.isCorrect) {
          optCls += ' user-wrong';
          markText = ' (Sizin cavabınız)';
        }

        optsHtml += `
          <div class="${optCls}">
            <strong>${letters[optIdx]})</strong>
            <span>${opt.text}${markText}</span>
          </div>
        `;
      });

      item.innerHTML = `
        <div class="review-meta">
          <div>${badgeHtml} <span style="margin-left:8px;">Testdə: Sual ${idx + 1} | Baza nömrəsi: №${q.id}</span></div>
        </div>
        <div class="review-q">${q.question}</div>
        <div class="review-opts">${optsHtml}</div>
      `;

      DOM.reviewList.appendChild(item);
    });

    if (DOM.reviewList.children.length === 0) {
      DOM.reviewList.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--muted-foreground); font-size:0.875rem;">Seçilmiş filtrə uyğun sual yoxdur.</div>`;
    }
  }

  // Question Bank Screen
  function renderQuestionBank(searchTerm = '') {
    DOM.bankListContainer.innerHTML = '';
    const term = searchTerm.trim().toLowerCase();

    const filtered = state.allQuestions.filter(q => {
      if (!term) return true;
      if (q.id.toString() === term) return true;
      if (q.question.toLowerCase().includes(term)) return true;
      return q.options.some(opt => opt.toLowerCase().includes(term));
    });

    DOM.bankTotalBadge.textContent = `Tapılan sual: ${filtered.length} / 240`;
    const letters = ['A', 'B', 'C', 'D', 'E'];

    filtered.forEach(q => {
      const card = document.createElement('div');
      card.className = 'review-item is-correct';

      let optsHtml = '';
      q.options.forEach((opt, optIdx) => {
        const isCorrect = (optIdx === q.correctIndex);
        const optCls = isCorrect ? 'review-opt-line is-correct-ans' : 'review-opt-line';
        const mark = isCorrect ? ' (Düzgün cavab)' : '';
        optsHtml += `
          <div class="${optCls}">
            <strong>${letters[optIdx]})</strong>
            <span>${opt}${mark}</span>
          </div>
        `;
      });

      card.innerHTML = `
        <div style="font-size:0.75rem; color:var(--muted-foreground); font-weight:600; margin-bottom:0.25rem;">SUAL № ${q.id}</div>
        <div class="review-q">${q.question}</div>
        <div class="review-opts">${optsHtml}</div>
      `;

      DOM.bankListContainer.appendChild(card);
    });
  }

  // Switch View
  function switchView(viewName) {
    state.currentView = viewName;
    DOM.screenSetup.classList.remove('active');
    DOM.screenQuiz.classList.remove('active');
    DOM.screenResult.classList.remove('active');
    DOM.screenBank.classList.remove('active');

    if (viewName === 'setup') {
      DOM.screenSetup.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'quiz') {
      DOM.screenQuiz.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'result') {
      DOM.screenResult.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'bank') {
      DOM.screenBank.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderQuestionBank(DOM.bankSearchInput.value);
    }
  }

  // Theme SVG Icon Rendering
  function updateThemeIcon(isDark) {
    if (!DOM.themeIcon) return;
    if (isDark) {
      // Sun icon
      DOM.themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
    } else {
      // Moon icon
      DOM.themeIcon.innerHTML = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`;
    }
  }

  // Setup Event Listeners
  function initEvents() {
    // Range Presets
    DOM.rangePresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const start = parseInt(btn.dataset.start, 10);
        const end = parseInt(btn.dataset.end, 10);
        DOM.inputRangeStart.value = start;
        DOM.inputRangeEnd.value = end;
        updateRangeState();
      });
    });

    DOM.inputRangeStart.addEventListener('input', updateRangeState);
    DOM.inputRangeEnd.addEventListener('input', updateRangeState);

    // Question Count Presets
    DOM.countPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.count;
        const available = (state.config.rangeEnd - state.config.rangeStart + 1);
        if (val === 'all') {
          DOM.inputCustomCount.value = available;
        } else {
          DOM.inputCustomCount.value = Math.min(parseInt(val, 10), available);
        }
        updateRangeState();
      });
    });

    DOM.inputCustomCount.addEventListener('input', updateRangeState);

    // Mode Selection
    DOM.modeCards.forEach(card => {
      card.addEventListener('click', () => {
        DOM.modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.config.mode = card.dataset.mode;
        if (state.config.mode === 'exam') {
          DOM.timerSettingsRow.style.display = 'flex';
          state.config.instantFeedback = false;
          if (DOM.switchInstantFeedback) DOM.switchInstantFeedback.checked = false;
          if (DOM.quizInstantCheck) DOM.quizInstantCheck.checked = false;
        } else {
          DOM.timerSettingsRow.style.display = 'none';
          state.config.instantFeedback = true;
          if (DOM.switchInstantFeedback) DOM.switchInstantFeedback.checked = true;
          if (DOM.quizInstantCheck) DOM.quizInstantCheck.checked = true;
        }
      });
    });

    // Instant Feedback Checkbox inside Quiz
    if (DOM.quizInstantCheck) {
      DOM.quizInstantCheck.addEventListener('change', (e) => {
        state.config.instantFeedback = e.target.checked;
        if (DOM.switchInstantFeedback) {
          DOM.switchInstantFeedback.checked = e.target.checked;
        }
        renderQuestion();
      });
    }

    // Instant Feedback Switch in Setup
    if (DOM.switchInstantFeedback) {
      DOM.switchInstantFeedback.addEventListener('change', (e) => {
        state.config.instantFeedback = e.target.checked;
        if (DOM.quizInstantCheck) {
          DOM.quizInstantCheck.checked = e.target.checked;
        }
      });
    }

    // Timer Switch
    DOM.switchTimer.addEventListener('change', (e) => {
      state.config.enableTimer = e.target.checked;
    });

    DOM.inputTimerMinutes.addEventListener('input', (e) => {
      state.config.timerMinutes = Math.max(1, parseInt(e.target.value, 10) || 50);
    });

    // Start Button
    DOM.btnStartQuiz.addEventListener('click', () => {
      updateRangeState();
      const success = buildQuizSession();
      if (success) {
        switchView('quiz');
        renderQuestion();
      }
    });

    // Prev / Next
    DOM.btnPrev.addEventListener('click', () => {
      goToQuestion(state.quiz.currentIndex - 1);
    });

    DOM.btnNext.addEventListener('click', () => {
      if (state.quiz.currentIndex === state.quiz.questions.length - 1) {
        askFinishQuiz();
      } else {
        goToQuestion(state.quiz.currentIndex + 1);
      }
    });

    // Flag Button
    DOM.btnFlagQuestion.addEventListener('click', () => {
      const idx = state.quiz.currentIndex;
      state.quiz.flagged[idx] = !state.quiz.flagged[idx];
      renderQuestion();
    });

    // Palette Modal
    DOM.btnOpenPalette.addEventListener('click', openPalette);
    DOM.btnClosePalette.addEventListener('click', closePalette);
    DOM.paletteModal.addEventListener('click', (e) => {
      if (e.target === DOM.paletteModal) closePalette();
    });

    // Finish / Submit
    DOM.btnFinishQuiz.addEventListener('click', askFinishQuiz);
    DOM.btnConfirmCancel.addEventListener('click', () => {
      DOM.confirmModal.classList.remove('active');
    });
    if (DOM.btnCloseConfirm) {
      DOM.btnCloseConfirm.addEventListener('click', () => {
        DOM.confirmModal.classList.remove('active');
      });
    }
    DOM.btnConfirmSubmit.addEventListener('click', finishQuiz);
    DOM.confirmModal.addEventListener('click', (e) => {
      if (e.target === DOM.confirmModal) {
        DOM.confirmModal.classList.remove('active');
      }
    });

    // Results screen actions
    DOM.btnRestartSame.addEventListener('click', () => {
      const success = buildQuizSession();
      if (success) {
        switchView('quiz');
        renderQuestion();
      }
    });

    DOM.btnChangeSettings.addEventListener('click', () => {
      switchView('setup');
    });

    DOM.btnFilterReviewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.btnFilterReviewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.reviewFilter = btn.dataset.filter;
        renderReviewList();
      });
    });

    // Question Bank Navigation
    DOM.btnOpenBankNav.addEventListener('click', () => {
      switchView('bank');
    });

    DOM.btnBackFromBank.addEventListener('click', () => {
      switchView('setup');
    });

    DOM.bankSearchInput.addEventListener('input', (e) => {
      renderQuestionBank(e.target.value);
    });

    DOM.btnHomeBrand.addEventListener('click', () => {
      if (state.currentView === 'quiz') {
        if (confirm('Test davam edir. Əsas səhifəyə qayıtmaq istəyirsiniz?')) {
          if (state.quiz.timerInterval) clearInterval(state.quiz.timerInterval);
          switchView('setup');
        }
      } else {
        switchView('setup');
      }
    });

    // Theme Toggle
    DOM.themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.body.removeAttribute('data-theme');
        updateThemeIcon(false);
        localStorage.setItem('sd_theme', 'light');
      } else {
        document.body.setAttribute('data-theme', 'dark');
        updateThemeIcon(true);
        localStorage.setItem('sd_theme', 'dark');
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (state.currentView !== 'quiz') return;
      if (DOM.paletteModal.classList.contains('active') || DOM.confirmModal.classList.contains('active')) return;

      const key = e.key.toUpperCase();
      if (['A', '1'].includes(key)) selectOption(0);
      else if (['B', '2'].includes(key)) selectOption(1);
      else if (['C', '3'].includes(key)) selectOption(2);
      else if (['D', '4'].includes(key)) selectOption(3);
      else if (['E', '5'].includes(key)) selectOption(4);
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        DOM.btnNext.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        DOM.btnPrev.click();
      } else if (key === 'F') {
        DOM.btnFlagQuestion.click();
      }
    });
  }

  // Initial Boot
  function init() {
    const savedTheme = localStorage.getItem('sd_theme');
    const isDark = (savedTheme === 'dark');
    if (isDark) {
      document.body.setAttribute('data-theme', 'dark');
    }
    updateThemeIcon(isDark);

    if (DOM.quizInstantCheck) {
      DOM.quizInstantCheck.checked = state.config.instantFeedback;
    }
    if (DOM.switchInstantFeedback) {
      DOM.switchInstantFeedback.checked = state.config.instantFeedback;
    }

    updateRangeState();
    initEvents();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
