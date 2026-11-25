/* Practice questions: sign in -> chapter -> question set -> question type -> questions.
   The questions live in question-data.js (QUESTIONS_DATA) and are shown exactly as written.
   Steps with only one choice are skipped automatically. */
(function () {
  "use strict";

  const PROGRESS_TABLE = "practice_progress"; // see supabase-practice-progress.sql
  const DATA = window.QUESTIONS_DATA || {};
  const $ = (id) => document.getElementById(id);
  const els = {
    status: $("status"), app: $("app"), crumbs: $("crumbs"),
    stepChapter: $("step-chapter"), stepSet: $("step-set"), stepType: $("step-type"), stepQuiz: $("step-quiz"),
    titleChapter: $("title-chapter"), titleSet: $("title-set"), titleType: $("title-type"), titleQuiz: $("title-quiz"),
    chapterChoices: $("chapter-choices"), setChoices: $("set-choices"), typeChoices: $("type-choices"),
    backToChapters: $("back-to-chapters"), backToSetsFromTypes: $("back-to-sets-from-types"),
    backToTypes: $("back-to-types"), backToSets: $("back-to-sets"), doneTypes: $("done-types"), doneSets: $("done-sets"),
    quizBody: $("quiz-body"), progress: $("progress"), bar: $("bar"), saveBox: $("save-progress"), saveLabel: $("save-label"), saveStatus: $("save-status"),
    level: $("level"), context: $("context"), question: $("question"), options: $("options"), feedback: $("feedback"),
    answer: $("answer"), answerRow: $("answer-row"), answerText: $("answer-text"), stepsLabel: $("steps-label"), stepsText: $("steps-text"),
    prev: $("prev"), next: $("next"), toggleAnswer: $("toggle-answer"),
    genBox: $("gen-box"), genToggle: $("gen-toggle"), genCount: $("gen-count"), genBadge: $("gen-badge"), regen: $("regen"),
    done: $("done"), doneTitle: $("done-title"), doneText: $("done-text"), restart: $("restart"),
    signOut: $("signout"), who: $("user"),
  };
  const GEN = window.QuestionGenerator || null;
  const GEN_KEY = "physicslearn-generator";
  const state = { gen: false, cache: {}, userId: null, chapter: null, set: null, type: null, list: [], index: 0, revealed: false, picked: null, saved: false, key: "", token: 0 };

  // ---------- text formatting (same mini-markup used when the questions were typed) ----------
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function fmt(t) {
    t = esc(t);
    const frac = /\[\[((?:(?!\[\[|\]\]).)*?)\|\|((?:(?!\[\[|\]\]).)*?)\]\]/g;
    let prev;
    do { prev = t; t = t.replace(frac, '<span class="frac"><span>$1</span><span>$2</span></span>'); } while (t !== prev);
    return t.replace(/_\{(.*?)\}/g, "<sub>$1</sub>").replace(/\^\{(.*?)\}/g, "<sup>$1</sup>")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\{\{(.*?)\}\}/g, '<span class="mark">$1</span>');
  }
  function el(tag, cls, html) { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  function renderBlocks(box, blocks) {
    (blocks || []).forEach((b) => {
      if (b.t === "p") box.appendChild(el("p", "", fmt(b.x)));
      else if (b.t === "m") box.appendChild(el("div", "pl-math", fmt(b.x)));
      else if (b.t === "h") box.appendChild(el("h5", "pl-method", fmt(b.x)));
      else if (b.t === "img") {
        const f = el("figure", "pl-fig");
        const i = document.createElement("img"); i.src = b.src; i.alt = b.alt || "Figure"; i.loading = "lazy";
        f.appendChild(i);
        if (b.cap) f.appendChild(el("figcaption", "", fmt(b.cap)));
        box.appendChild(f);
      } else if (b.t === "table") {
        const t = el("table", "pl-table");
        t.appendChild(el("thead", "", "<tr>" + b.head.map((h) => "<th>" + fmt(h) + "</th>").join("") + "</tr>"));
        t.appendChild(el("tbody", "", b.rows.map((r) => "<tr>" + r.map((c) => "<td>" + fmt(c) + "</td>").join("") + "</tr>").join("")));
        const w = el("div", "pl-table-wrap"); w.appendChild(t); box.appendChild(w);
      }
    });
  }

  // ---------- helpers over the data ----------
  const chapterKeys = () => Object.keys(DATA).filter((k) => Object.values(DATA[k].sets).some((s) => s.questions.length));
  const setKeys = (c) => Object.keys(DATA[c].sets).filter((k) => DATA[c].sets[k].questions.length);
  const typesOf = (c, s) => DATA[c].sets[s].questions.reduce((a, q) => (a.includes(q.type) ? a : a.concat(q.type)), []);
  const questionsFor = (c, s, type) => DATA[c].sets[s].questions.filter((q) => !type || q.type === type);
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const progressKey = (s, type) => (type ? s + "#" + slug(type) : s);
  const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function applySavedOrder(questions, ids) {
    const by = new Map(questions.map((q) => [q.id, q])), used = new Set(), out = [];
    (Array.isArray(ids) ? ids : []).forEach((id) => { const q = by.get(id); if (q && !used.has(id)) { out.push(q); used.add(id); } });
    questions.forEach((q) => { if (!used.has(q.id)) out.push(q); });
    return out;
  }

  // ---------- saved progress (Supabase) ----------
  let writeChain = Promise.resolve();
  function queueWrite(task) {
    writeChain = writeChain.then(task).then(() => setSaveHint(), (err) => { console.error("Saving progress failed:", err); setSaveHint("We couldn't reach the server, so your progress may not be saved."); });
  }
  async function loadSavedProgress() {
    const { data, error } = await window.PL.db.from(PROGRESS_TABLE).select("question_order, position")
      .eq("user_id", state.userId).eq("chapter", state.chapter).eq("topic", state.key).maybeSingle();
    if (error) throw error;
    return data;
  }
  function persistProgress() {
    if (!state.saved) return;
    const row = { user_id: state.userId, chapter: state.chapter, topic: state.key, question_order: state.list.map((q) => q.id), position: state.index, updated_at: new Date().toISOString() };
    queueWrite(async () => { const { error } = await window.PL.db.from(PROGRESS_TABLE).upsert(row, { onConflict: "user_id,chapter,topic" }); if (error) throw error; });
  }
  function clearProgress() {
    const { userId, chapter, key } = { userId: state.userId, chapter: state.chapter, key: state.key };
    queueWrite(async () => { const { error } = await window.PL.db.from(PROGRESS_TABLE).delete().eq("user_id", userId).eq("chapter", chapter).eq("topic", key); if (error) throw error; });
  }
  function setSaveHint(problem) {
    els.saveStatus.classList.toggle("ml-message--error", !!problem);
    els.saveStatus.textContent = problem || (state.saved
      ? "Saved. When you come back to this set, the questions will be in this same order and you'll continue from where you stopped."
      : "Not saved. The questions are shuffled each time you open this set.");
  }

  // ---------- steps / navigation ----------
  function crumbs(step) {
    const parts = [];
    if (state.chapter) parts.push(DATA[state.chapter].label);
    if (state.set) parts.push(DATA[state.chapter].sets[state.set].label);
    if (state.type) parts.push(state.type);
    const labels = { chapter: ["Chapter"], set: [...parts.slice(0, 1), "Question set"], type: [...parts.slice(0, 2), "Question type"], quiz: [...parts, "Questions"] };
    const list = labels[step];
    els.crumbs.textContent = "";
    list.forEach((t, i) => { const s = el("span"); s.textContent = t; if (i === list.length - 1) { s.className = "is-current"; s.setAttribute("aria-current", "step"); } els.crumbs.appendChild(s); });
  }
  function show(step, focus) {
    els.stepChapter.hidden = step !== "chapter"; els.stepSet.hidden = step !== "set"; els.stepType.hidden = step !== "type"; els.stepQuiz.hidden = step !== "quiz";
    crumbs(step);
    if (focus) ({ chapter: els.titleChapter, set: els.titleSet, type: els.titleType, quiz: els.titleQuiz })[step].focus();
  }
  function choice(box, name, meta, onClick) {
    const b = el("button", "ml-choice"); b.type = "button";
    b.append(el("span", "ml-choice-name", esc(name)), el("span", "ml-choice-meta", esc(meta)));
    b.addEventListener("click", onClick); box.appendChild(b);
  }
  function showChapters(focus) {
    state.chapter = state.set = state.type = null;
    const keys = chapterKeys();
    if (keys.length === 1) { chooseChapter(keys[0], focus); return; }
    els.chapterChoices.textContent = "";
    keys.forEach((k) => { const n = setKeys(k).reduce((s, x) => s + DATA[k].sets[x].questions.length, 0); choice(els.chapterChoices, DATA[k].label, plural(n, "question"), () => chooseChapter(k, true)); });
    show("chapter", focus);
  }
  function chooseChapter(key, focus) {
    state.chapter = key; state.set = state.type = null;
    const keys = setKeys(key);
    if (keys.length === 1) { chooseSet(keys[0], focus); return; }
    els.setChoices.textContent = "";
    keys.forEach((k) => { const n = DATA[key].sets[k].questions.length; choice(els.setChoices, DATA[key].sets[k].label, plural(n, "question"), () => chooseSet(k, true)); });
    els.backToChapters.hidden = chapterKeys().length < 2;
    show("set", focus);
  }
  function chooseSet(key, focus) {
    state.set = key; state.type = null;
    const types = typesOf(state.chapter, key);
    if (types.length === 1) { startQuiz(types[0], focus); return; }
    els.typeChoices.textContent = "";
    types.forEach((t) => choice(els.typeChoices, t, plural(questionsFor(state.chapter, key, t).length, "question"), () => startQuiz(t, true)));
    els.backToSetsFromTypes.hidden = setKeys(state.chapter).length < 2 && chapterKeys().length < 2;
    show("type", focus);
  }
  const hasTypes = () => typesOf(state.chapter, state.set).length > 1;
  const hasSets = () => setKeys(state.chapter).length > 1;

  async function startQuiz(type, focus) {
    const token = ++state.token;
    state.type = type; state.key = progressKey(state.set, hasTypes() ? type : "");
    state.index = 0; state.revealed = false; state.picked = null; state.saved = false; state.list = [];
    els.done.hidden = true; els.quizBody.hidden = true;
    els.backToTypes.hidden = !hasTypes(); els.doneTypes.hidden = !hasTypes();
    els.backToSets.hidden = !hasSets() && chapterKeys().length < 2;
    els.doneSets.hidden = els.backToSets.hidden;
    els.saveLabel.textContent = "Save my progress in this " + (hasTypes() ? "question type" : "set");
    els.saveStatus.classList.remove("ml-message--error"); els.saveStatus.textContent = "Loading…";
    show("quiz", focus);

    const questions = questionsFor(state.chapter, state.set, hasTypes() ? type : null);
    let saved = null, problem = "";
    try { saved = await loadSavedProgress(); }
    catch (err) { console.error("Couldn't load saved progress:", err); problem = "We couldn't check your saved progress, so these questions are shuffled and won't be saved this time."; }
    if (token !== state.token) return;
    if (saved && Array.isArray(saved.question_order)) {
      state.list = applySavedOrder(questions, saved.question_order);
      state.index = Math.min(Math.max(parseInt(saved.position, 10) || 0, 0), state.list.length - 1);
      state.saved = true;
    } else state.list = shuffle(questions);
    els.saveBox.checked = state.saved; els.saveBox.disabled = !!problem;
    setupGenerator();
    els.quizBody.hidden = false;
    renderQuestion(); setSaveHint(problem);
    if (state.saved && state.index > 0) els.saveStatus.textContent = "Welcome back. You're continuing from where you stopped, in your saved order.";
  }

  // ---------- generated variants ----------
  const base = () => state.list[state.index];
  function cur() {
    const q = base();
    if (state.gen && GEN && GEN.has(q.id)) { if (!state.cache[q.id]) state.cache[q.id] = GEN.generate(q) || q; return state.cache[q.id]; }
    return q;
  }
  const isGenerated = () => cur() !== base();
  function setupGenerator() {
    const n = GEN ? state.list.filter((q) => GEN.has(q.id)).length : 0;
    els.genBox.hidden = !n;
    els.genCount.textContent = n ? "(" + n + " of " + state.list.length + " questions here)" : "";
    try { state.gen = !!n && localStorage.getItem(GEN_KEY) === "1"; } catch (e) { state.gen = false; }
    state.cache = {}; els.genToggle.checked = state.gen;
  }

  // ---------- one question ----------
  const LETTERS = ["A", "B", "C", "D", "E"];
  function renderQuestion() {
    const q = cur(), n = state.list.length;
    state.revealed = false; state.picked = null;
    els.progress.textContent = "Question " + (state.index + 1) + " of " + n;
    els.bar.style.width = ((state.index + 1) / n * 100) + "%";
    els.level.textContent = DATA[state.chapter].sets[state.set].label + " · " + q.type;
    els.genBadge.hidden = !isGenerated(); els.regen.hidden = !isGenerated();

    els.context.textContent = ""; els.context.hidden = !q.context;
    if (q.context) { if (q.context.label) els.context.appendChild(el("p", "pl-context-label", fmt(q.context.label))); renderBlocks(els.context, q.context.blocks); }
    els.question.textContent = ""; renderBlocks(els.question, q.question);

    els.options.textContent = ""; els.feedback.hidden = true; els.feedback.className = "pl-feedback";
    const hasOpts = !!(q.options || q.optionsImage);
    els.options.hidden = !hasOpts;
    if (q.optionsImage) { const f = el("figure", "pl-fig"); const i = document.createElement("img"); i.src = q.optionsImage.src; i.alt = q.optionsImage.alt; f.appendChild(i); els.options.appendChild(f); }
    const count = q.options ? q.options.length : 4;
    if (hasOpts) {
      const row = el("div", q.optionsImage ? "pl-opt-row pl-opt-row--letters" : "pl-opt-row");
      for (let k = 0; k < count; k++) {
        const b = el("button", "pl-opt"); b.type = "button"; b.dataset.letter = LETTERS[k];
        b.innerHTML = '<span class="pl-opt-letter">' + LETTERS[k] + "</span>" + (q.options ? '<span class="pl-opt-text">' + fmt(q.options[k]) + "</span>" : "");
        b.addEventListener("click", () => pick(LETTERS[k]));
        row.appendChild(b);
      }
      els.options.appendChild(row);
    }
    els.answer.hidden = true; els.toggleAnswer.textContent = q.answer ? "Show answer" : "Show worked solution";
    els.toggleAnswer.setAttribute("aria-expanded", "false");
    els.prev.disabled = state.index === 0;
    els.next.textContent = state.index === n - 1 ? "Finish" : "Next →";
    persistProgress();
  }
  function pick(letter) {
    if (state.picked) return;
    const q = cur(); if (!q.answer) return;
    state.picked = letter;
    const ok = letter === q.answer;
    els.options.querySelectorAll(".pl-opt").forEach((b) => { b.disabled = true; if (b.dataset.letter === letter) b.classList.add(ok ? "is-correct" : "is-wrong"); });
    els.feedback.hidden = false;
    els.feedback.className = "pl-feedback " + (ok ? "pl-feedback--ok" : "pl-feedback--no");
    els.feedback.textContent = ok ? "Correct! Tap “Show answer” to see the working." : "Not quite. Tap “Show answer” to see the correct answer and the working.";
  }
  function reveal(show) {
    const q = cur();
    state.revealed = show; els.answer.hidden = !show;
    els.toggleAnswer.textContent = show ? (q.answer ? "Hide answer" : "Hide worked solution") : (q.answer ? "Show answer" : "Show worked solution");
    els.toggleAnswer.setAttribute("aria-expanded", String(show));
    if (!show) return;
    els.answerRow.hidden = !q.answer;
    if (q.answer) {
      const idx = LETTERS.indexOf(q.answer);
      els.answerText.innerHTML = esc(q.answer) + (q.options && idx >= 0 ? ". " + fmt(q.options[idx]) : "");
      els.options.querySelectorAll(".pl-opt").forEach((b) => { b.disabled = true; if (b.dataset.letter === q.answer) b.classList.add("is-correct"); });
    }
    els.stepsLabel.textContent = q.answer ? "Steps and explanation" : "Worked solution";
    els.stepsText.textContent = ""; renderBlocks(els.stepsText, q.steps);
  }
  function go(delta) {
    const next = state.index + delta;
    if (next >= state.list.length) { finish(); return; }
    if (next < 0) return;
    state.index = next; renderQuestion();
  }
  function finish() {
    els.quizBody.hidden = true; els.done.hidden = false;
    els.doneText.textContent = "You've worked through " + plural(state.list.length, "question") + " in this " + (hasTypes() ? "question type" : "set") + ".";
    if (state.saved) { state.index = 0; persistProgress(); }
  }

  els.toggleAnswer.addEventListener("click", () => reveal(!state.revealed));
  els.next.addEventListener("click", () => go(1));
  els.prev.addEventListener("click", () => go(-1));
  els.restart.addEventListener("click", () => { state.cache = {}; state.list = shuffle(state.list); state.index = 0; els.done.hidden = true; els.quizBody.hidden = false; renderQuestion(); });
  els.genToggle.addEventListener("change", () => {
    state.gen = els.genToggle.checked; state.cache = {};
    try { localStorage.setItem(GEN_KEY, state.gen ? "1" : "0"); } catch (e) {}
    renderQuestion();
  });
  els.regen.addEventListener("click", () => { delete state.cache[base().id]; renderQuestion(); });
  els.saveBox.addEventListener("change", () => { state.saved = els.saveBox.checked; if (state.saved) persistProgress(); else clearProgress(); setSaveHint(); });
  const backToTypes = () => chooseSet(state.set, true);
  const backToSets = () => chooseChapter(state.chapter, true);
  els.backToTypes.addEventListener("click", backToTypes); els.doneTypes.addEventListener("click", backToTypes);
  els.backToSets.addEventListener("click", backToSets); els.doneSets.addEventListener("click", backToSets);
  els.backToSetsFromTypes.addEventListener("click", backToSets);
  els.backToChapters.addEventListener("click", () => showChapters(true));

  async function main() {
    if (!window.PL) { els.status.textContent = "Accounts aren't set up on this site yet."; els.status.classList.add("ml-message--error"); return; }
    const user = await window.PL.requireUser();
    if (!user) return;
    state.userId = user.id;
    els.who.textContent = "Signed in as " + user.email + ".";
    els.signOut.addEventListener("click", () => window.PL.signOut());
    if (!chapterKeys().length) { els.status.textContent = "No practice questions are available yet."; return; }
    els.status.hidden = true; els.app.hidden = false;
    showChapters(false);
  }
  main().catch((err) => { console.error(err); els.status.textContent = "Something went wrong loading your account. Please refresh the page."; els.status.classList.add("ml-message--error"); });
})();
