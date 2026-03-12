// ── Modal management ──────────────────────────────────────────────────────────
function openModal(id) {
  var el = document.getElementById(id);
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
  el.querySelector('.modal-close').focus();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(function(m) {
      closeModal(m.id);
    });
  }
});

// ── Scroll reveal ─────────────────────────────────────────────────────────────
var revealObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(function(el) {
  revealObs.observe(el);
});

// ── Google Forms config ───────────────────────────────────────────────────────
var FORMS = {
  consumer: {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSchwGu5YMCh7znTFPc-1-ourQdjXmeOBqiY2w0ln1Cv4BvTkw/formResponse',
    fields: {
      'would-fund':       'entry.1051065512',
      'game-ownership':   'entry.869354428',
      'tangible-rewards': 'entry.766248881',
      'play-indie':       'entry.1945735440',
      'discovery':        'entry.1729020336',
      'referral':         'entry.1725240863',
      'email':            'entry.143989156'
    }
  },
  dev: {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSeK0Y3SYwJ2wUBo2FmHXiq3vocYK6cKx00kksCEqfwGyE0z4w/formResponse',
    fields: {
      'studio-size':    'entry.1051065512',
      'in-development': 'entry.869354428',
      'barrier':        'entry.766248881',
      'funding-impact': 'entry.1945735440',
      'crunch':         'entry.1729020336',
      'dev-referral':   'entry.1725240863',
      'email':          'entry.143989156'
    }
  }
};

// ── Survey engine ─────────────────────────────────────────────────────────────
function buildSurvey(questions, containerId, surveyKey) {
  var container = document.getElementById(containerId);
  var step = 0;
  var answers = {};

  function canAdvance() {
    var q = questions[step];
    if (q.type === 'email') return true;
    var a = answers[q.id];
    if (q.type === 'multi') return a && a.length > 0;
    return !!a;
  }

  function submitToGoogleForms() {
    var form = FORMS[surveyKey];
    if (!form) return;
    var body = new FormData();
    for (var qid in form.fields) {
      var entryId = form.fields[qid];
      var val = answers[qid];
      if (!val) continue;
      if (Array.isArray(val)) {
        for (var i = 0; i < val.length; i++) body.append(entryId, val[i]);
      } else {
        body.append(entryId, val);
      }
    }
    fetch(form.url, { method: 'POST', body: body, mode: 'no-cors' }).catch(function() {});
  }

  function renderThanks() {
    var email = answers['email'] || '';
    var emailMsg = email ? ' We\'ll reach out to ' + email + ' when we go live.' : '';
    var html = '<div class="survey-thanks">';
    html += '<div class="thanks-badge">[?]</div>';
    html += '<h4 class="thanks-heading">Scout achievement unlocked.</h4>';
    html += '<p class="thanks-sub">Thank you. Seriously. This data shapes everything about how FPC launches.' + emailMsg + '</p>';
    html += '<div class="thanks-next-label">// what next?</div>';
    html += '<div class="thanks-ctas"><a href="#payment" class="btn btn-primary survey-payment-link">Support FPC Now</a></div>';
    html += '</div>';
    container.innerHTML = html;
    var link = container.querySelector('.survey-payment-link');
    if (link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var modal = container.closest('.modal-overlay');
        if (modal) closeModal(modal.id);
        setTimeout(function() {
          var payEl = document.getElementById('payment');
          if (payEl) payEl.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      });
    }
  }

  function render() {
    if (sessionStorage.getItem(surveyKey + '_done')) { renderThanks(); return; }

    var q = questions[step];
    var isLast = step === questions.length - 1;
    var pct = Math.round(((step + 1) / questions.length) * 100);

    var html = '<div class="survey-card">';
    html += '<div class="survey-progress">';
    html += '<div class="survey-progress-bar"><div class="survey-progress-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="survey-progress-label">[ ' + (step + 1) + ' / ' + questions.length + ' ]</div>';
    html += '</div>';
    html += '<div class="survey-question">';
    html += '<p class="survey-q-text">' + q.text + '</p>';
    if (q.subtext) html += '<p class="survey-q-sub">' + q.subtext + '</p>';
    html += '</div>';
    html += '<div class="survey-answers">';

    if (q.type === 'single' || q.type === 'multi') {
      for (var i = 0; i < q.options.length; i++) {
        var opt = q.options[i];
        var sel = q.type === 'single'
          ? answers[q.id] === opt
          : (answers[q.id] || []).indexOf(opt) > -1;
        // Store option index in data-index — no quoting of option text needed at all
        html += '<button class="survey-option' + (sel ? ' selected' : '') + '" data-idx="' + i + '">';
        html += '<span class="survey-option-check">' + (sel ? '[x]' : '[ ]') + '</span>';
        html += opt + '</button>';
      }
    } else if (q.type === 'email') {
      html += '<div class="survey-email-wrap">';
      html += '<input type="text" inputmode="email" class="survey-email-input survey-email-live"';
      html += ' placeholder="' + (q.placeholder || 'your@email.com') + '"';
      html += ' value="' + (answers['email'] || '') + '">';
      html += '<div class="survey-optional">Optional — skip if you prefer.</div>';
      html += '</div>';
    }

    html += '</div>';
    html += '<div class="survey-nav">';
    html += step > 0 ? '<button class="survey-back survey-nav-back"><< back</button>' : '<span></span>';
    html += '<button class="btn btn-primary survey-nav-next"';
    if (!canAdvance()) html += ' disabled style="opacity:0.4;cursor:not-allowed"';
    html += '>' + (isLast ? 'Submit Survey' : 'Next >>') + '</button>';
    html += '</div></div>';

    container.innerHTML = html;

    // Wire option clicks via delegation — index looks up original option string
    // so apostrophes, dashes, anything in option text is completely irrelevant
    var answersDiv = container.querySelector('.survey-answers');
    if (answersDiv) {
      answersDiv.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-idx]');
        if (!btn) return;
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        var chosen = q.options[idx];
        if (q.type === 'single') {
          answers[q.id] = chosen;
          render();
        } else {
          var existing = answers[q.id] || [];
          var pos = existing.indexOf(chosen);
          answers[q.id] = pos > -1
            ? existing.filter(function(v) { return v !== chosen; })
            : existing.concat([chosen]);
          render();
        }
      });
    }

    // Email input — update answers silently, no re-render, focus stays
    var emailInput = container.querySelector('.survey-email-live');
    if (emailInput) {
      emailInput.addEventListener('input', function() {
        answers['email'] = this.value;
      });
      emailInput.focus();
    }

    // Back
    var backBtn = container.querySelector('.survey-nav-back');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        step = Math.max(0, step - 1);
        render();
      });
    }

    // Next / Submit
    var nextBtn = container.querySelector('.survey-nav-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        // Capture email at submit time in case browser autocomplete filled it silently
        var emailEl = container.querySelector('.survey-email-live');
        if (emailEl) answers['email'] = emailEl.value;

        if (isLast) {
          sessionStorage.setItem(surveyKey + '_done', '1');
          renderThanks();
          submitToGoogleForms();
        } else {
          step++;
          render();
        }
      });
    }
  }

  render();
}

// ── Survey questions ──────────────────────────────────────────────────────────
var consumerQuestions = [
  {
    id: 'would-fund',
    type: 'single',
    text: 'Would you back a game you believe in for $5/month — even just for the sake of supporting the people making it?',
    options: ['Yes, absolutely', "Probably — I'd want to know more first", 'Maybe, depends on the game/studio', 'Probably not']
  },
  {
    id: 'game-ownership',
    type: 'single',
    text: 'For $5/month to feel worth it, would you need to receive the game for free when it ships — or would a steep discount work?',
    options: ['Free game is important to me', 'A steep discount would be fine', "I don't need the game at all — I'm backing the people", 'Not sure']
  },
  {
    id: 'tangible-rewards',
    type: 'single',
    text: 'How important are tangible physical rewards to you — things like stickers, enamel badges, postcards, or booklets?',
    options: ['Very important — I love physical things', 'Nice to have, not essential', 'Not important at all', 'Depends on the quality']
  },
  {
    id: 'play-indie',
    type: 'single',
    text: 'Do you play indie games?',
    options: ["Yes — they're my main thing", 'Yes — alongside bigger titles', 'Occasionally', 'Not really']
  },
  {
    id: 'discovery',
    type: 'multi',
    text: 'Where do you usually discover indie games to play? (Select all that apply)',
    options: ['Steam / storefronts', 'itch.io', 'YouTube / Twitch / streaming', 'Reddit / forums', 'Twitter / social media', 'Word of mouth / friends', 'Gaming press / reviews', 'Game jams']
  },
  {
    id: 'referral',
    type: 'single',
    text: 'How did you hear about Fair Play Collective?',
    options: ['Twitter / X', 'Instagram', 'TikTok', 'Reddit', 'A friend or colleague', 'Discord', 'Search engine', 'Other']
  },
  {
    id: 'email',
    type: 'email',
    text: 'Last one. Drop your email if you want to be notified when FPC launches — and lock in your Scout achievement.',
    subtext: 'Completing this survey earns you the Scout badge on your future FPC profile. If you also pledge, that email links your Day Zero badge too.',
    placeholder: 'your@email.com'
  }
];

var devQuestions = [
  {
    id: 'studio-size',
    type: 'single',
    text: "What's your current studio size?",
    options: ['Solo developer', '2–3 people', '4–8 people', 'Larger than 8']
  },
  {
    id: 'in-development',
    type: 'single',
    text: 'Do you have a game currently in active development?',
    options: ['Yes — actively building', 'Yes — early stages / pre-production', 'Not yet, but planning to start', 'Between projects right now']
  },
  {
    id: 'barrier',
    type: 'single',
    text: "What's the biggest barrier your studio faces right now?",
    options: ['Stable funding / runway', 'Time to work on the project', 'Team size / hiring', 'Publisher or investor pressure', 'Discoverability / marketing', 'Other']
  },
  {
    id: 'funding-impact',
    type: 'single',
    text: 'What would stable 24-month funding change for your studio?',
    options: ['I could go full-time on my project', 'I could hire collaborators', 'I could stop rushing to ship', 'It would remove the need for a publisher', "It wouldn't change much — I'm already stable"]
  },
  {
    id: 'crunch',
    type: 'single',
    text: 'What does "no crunch" mean to your current workflow?',
    options: ["We already practice it — it's core to how we work", "We aspire to it but don't always hit it", "We struggle with it — external pressure makes it hard", "It's not really relevant to our situation"]
  },
  {
    id: 'dev-referral',
    type: 'single',
    text: 'How did you hear about Fair Play Collective?',
    options: ['Twitter / X', 'Instagram', 'TikTok', 'Reddit', 'A friend or colleague', 'Discord', 'Search engine', 'Other']
  },
  {
    id: 'email',
    type: 'email',
    text: 'Drop your email to be notified when FPC opens applications — and tell us anything else you want us to know.',
    subtext: 'We read every single one of these. If you have something specific to say about your studio, this is the place.',
    placeholder: 'studio@yourdomain.com'
  }
];

// ── Contributors modal ────────────────────────────────────────────────────────
function loadContributors() {
  var list = document.getElementById('contribList');
  if (!list) return;
  fetch('contributors.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var names = data.contributors || [];
      if (!names.length) {
        list.innerHTML = '<li class="contrib-empty">// none listed yet</li>';
        return;
      }
      list.innerHTML = names.map(function(name) {
        return '<li class="contrib-item"><span class="contrib-item-icon">&lt;3&gt;</span>' + name + '</li>';
      }).join('');
    })
    .catch(function() {
      list.innerHTML = '<li class="contrib-empty">// could not load contributors</li>';
    });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  buildSurvey(consumerQuestions, 'consumerSurveyContainer', 'consumer');
  buildSurvey(devQuestions, 'devSurveyContainer', 'dev');
});
