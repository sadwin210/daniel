/* Раздел «Модуль»: тесты по каждому разделу и итоговый тест на 50 вопросов.
   Вопросы берутся из банка (data/questions.js) и строятся автоматически из конспекта;
   при каждом запуске выбираются заново и перемешиваются. */
(function () {
  "use strict";

  const PAGES = (window.APP_PAGES = window.APP_PAGES || {});
  const BANK = window.ANATOMY_QUESTIONS || {};
  const HIST_KEY = "anatomy-module-v1";
  const CFG_KEY = "anatomy-module-cfg-v1";
  const FINAL_PER_SECTION = 10;
  const HAND_SHARE = 0.4; // доля вопросов из банка в тесте

  let A = null;         // window.APP (помощники из app.js)
  let view = "home";    // home | run | result
  let run = null;       // текущий или последний тест
  let cfg = { count: 30, format: "mcq", reveal: "now" };
  let hist = {};
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(CFG_KEY)) || {}); } catch (e) { /* по умолчанию */ }
  try { hist = JSON.parse(localStorage.getItem(HIST_KEY)) || {}; } catch (e) { hist = {}; }
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* без сохранения */ } };

  const norm = (s) => String(s).toLowerCase().replace(/ё/g, "е");
  const pct = (r, t) => (t ? Math.round((r / t) * 100) : 0);

  /* ---------- подготовка раздела ---------- */
  // общие слова, которые не выдают ответ, даже если встречаются в названии
  const COMMON = ["ребен", "новор", "детей", "infan", "neona", "мышцы", "мышца", "muscu", "суста", "artic", "артер", "arter",
    "строе", "общий", "общая", "общее", "систе", "syste", "орган", "organ", "кость", "кости", "часть", "отдел", "внутр", "наруж"];
  function leaks(text, item) {
    const t = norm(text);
    return (item.n + " " + item.l).split(/[^A-Za-zА-Яа-яЁё]+/)
      .filter((w) => w.length >= 5).map((w) => norm(w).slice(0, 5))
      .some((w) => COMMON.indexOf(w) < 0 && t.indexOf(w) >= 0);
  }

  // слишком общие слова: «поверхность», «край», «тело» есть почти у каждой кости и органа
  const GENERIC = /^(facies|margo|paries|corpus|basis|apex|lobus|hilum|cortex|medulla|capsula)\b/;
  const OVERVIEW = /^(Классификация|Строение|Особенности|Топография|Движения|Слабые|Звенья|Изменения|Вспомогательный|Внутренние органы|Скелет человека)/;

  // латинские слова ответа: вариант с теми же терминами был бы «почти правильным», поэтому в дистракторы не берётся
  const PLAIN_WORDS = new Set(["processus", "facies", "lineae", "crista", "fascia", "musculi", "plexus", "musculares", "anterior", "posterior",
    "superior", "inferior", "lateralis", "medialis", "laterale", "mediale", "dorsalis", "phalanx", "phalanges", "proximalis", "distalis",
    "distales", "mediae", "corpus", "longum", "longus", "brevis", "externum", "internum", "obliquum", "transversum", "superficiale", "profundum"]);
  const latinWords = (s) => (norm(s).match(/[a-z]{6,}/g) || []).filter((w) => !PLAIN_WORDS.has(w));

  const pools = {};
  function pool(sec) {
    if (pools[sec.id]) return pools[sec.id];
    const entries = [];
    sec.topics.forEach((topic) => topic.items.forEach((item, idx) => entries.push({ sec, topic, item, idx })));
    entries.forEach((e) => { e.hay = norm(JSON.stringify(e.item)); });

    const fCount = {};
    entries.forEach((e) => { if (e.item.f) fCount[norm(e.item.f)] = (fCount[norm(e.item.f)] || 0) + 1; });

    entries.forEach((e) => {
      // «образования» пункта: строки «Latin — русский», первый термин которых есть только в этом пункте раздела.
      // В темах «Возрастные особенности» строки — это утверждения, а не части, поэтому там такие вопросы не строятся.
      e.parts = [];
      (e.topic.age ? [] : e.item.p || []).forEach((line) => {
        const cut = line.indexOf(" — ");
        if (cut < 0) return;
        const head = line.slice(0, cut);
        if (/[А-Яа-яЁё]/.test(head) || !/[a-z]{3}/.test(head)) return;
        const first = norm(head.split(",")[0].trim());
        if (first.length < 6 || GENERIC.test(first)) return;
        if (entries.filter((x) => x.hay.indexOf(first) >= 0).length !== 1) return;
        const label = line.split(/[:;]/)[0].replace(/\s*\([^)]*\)\s*$/, "").trim();
        if (label.length > 120 || leaks(label, e.item)) return;
        e.parts.push(label);
      });
      const it = e.item;
      e.descOk = !!(it.d && !it.o && !it.s && it.d.length >= 80 && !leaks(it.d, it));
      // латинское название спрашиваем только у настоящих терминов, а не у заголовков обзорных пунктов
      e.latinOk = !e.topic.age && it.l.indexOf(",") < 0 && !OVERVIEW.test(it.n);
      e.typeOk = !!it.t && !/^(Комбинированный с|Вместе с|Функционально)/.test(it.t);
    });

    const hand = (BANK[sec.id] || []).map((h) => {
      const ref = h.ref ? entries.find((x) => x.topic.id === h.ref[0] && x.item.n === h.ref[1]) : null;
      return { h, ref };
    });
    return (pools[sec.id] = { sec, entries, fCount, hand });
  }

  /* ---------- построение вопросов ---------- */
  const opt = (label, kind, ok) => ({ label, kind, ok: !!ok });
  function question(e, prompt, text, kind, options) {
    return { sec: e.sec, topic: e.topic, item: e.item, idx: e.idx, prompt, text, kind, options: A.shuffle(options) };
  }

  // три неправильных варианта: до двух из той же темы (похожие), остальные из раздела
  function others(e, P, pred, keyOf) {
    const used = new Set([keyOf(e)]);
    const out = [];
    const take = (list, limit) => {
      for (const x of A.shuffle(list)) {
        if (out.length >= limit) break;
        if (x === e || !pred(x)) continue;
        const k = keyOf(x);
        if (used.has(k)) continue;
        used.add(k);
        out.push(x);
      }
    };
    take(P.entries.filter((x) => x.topic === e.topic), 2);
    take(P.entries.filter((x) => x.topic !== e.topic), 3);
    take(P.entries, 3);
    return out.length === 3 ? out : null;
  }

  function byField(e, P, field, prompt, keyOf, pred) {
    if (!e.item[field]) return null;
    const key = keyOf || ((x) => norm(x.item[field]));
    const mine = new Set(latinWords(e.item[field]));
    const ok = pred || ((x) => !!x.item[field]);
    const o = others(e, P, (x) => ok(x) && !latinWords(x.item[field]).some((w) => mine.has(w)), key);
    return o && question(e, prompt, e.item.n, "plain", [e].concat(o).map((x) => opt(x.item[field], "rich", x === e)));
  }
  function byName(e, P, prompt, text, kind, pred) {
    const o = others(e, P, pred || (() => true), (x) => norm(x.item.n));
    return o && question(e, prompt, text, kind, [e].concat(o).map((x) => opt(x.item.n, "plain", x === e)));
  }

  const GEN = {
    toLatin(e, P) {
      if (!e.latinOk) return null;
      const o = others(e, P, (x) => x.latinOk, (x) => norm(x.item.l));
      return o && question(e, "Как это называется по-латыни?", e.item.n, "plain", [e].concat(o).map((x) => opt(x.item.l, "latin", x === e)));
    },
    fromLatin: (e, P) => (e.latinOk ? byName(e, P, "Что это по-русски?", e.item.l, "latin", (x) => x.latinOk) : null),
    func: (e, P) => (e.item.f && e.item.o && P.fCount[norm(e.item.f)] === 1
      ? byName(e, P, "Какая мышца выполняет эту функцию?", e.item.f, "rich", (x) => !!x.item.o) : null),
    origin: (e, P) => byField(e, P, "o", "Откуда начинается эта мышца?"),
    insertion: (e, P) => byField(e, P, "i", "Куда прикрепляется эта мышца?"),
    nerve: (e, P) => byField(e, P, "v", "Чем иннервируется эта мышца?"),
    jtype: (e, P) => (e.typeOk ? byField(e, P, "t", "Какой это сустав по форме и строению?", (x) => norm(x.item.t).slice(0, 5), (x) => x.typeOk) : null),
    ligs: (e, P) => byField(e, P, "g", "Какие связки укрепляют этот сустав?"),
    partOf(e, P) {
      if (!e.parts.length) return null;
      return byName(e, P, "К чему относится это образование?", A.shuffle(e.parts)[0], "rich");
    },
    hasPart(e, P) {
      if (!e.parts.length) return null;
      const o = others(e, P, (x) => x.parts.length > 0, (x) => x.idx + "/" + x.topic.id);
      return o && question(e, "Что из перечисленного относится сюда?", e.item.n + " (" + e.item.l + ")", "rich",
        [e].concat(o).map((x) => opt(A.shuffle(x.parts)[0], "rich", x === e)));
    },
    about: (e, P) => (e.descOk ? byName(e, P, "О чём идёт речь?", e.item.d, "rich") : null),
  };

  function auto(e, P) {
    const it = e.item;
    const menu = it.o ? [["func", 3], ["origin", 2], ["insertion", 2], ["nerve", 3], ["toLatin", 1], ["fromLatin", 1]]
      : it.s ? [["jtype", 2], ["ligs", 3], ["toLatin", 1], ["fromLatin", 1]]
        : [["partOf", 3], ["hasPart", 3], ["about", 3], ["toLatin", 1.5], ["fromLatin", 1.5]];
    // случайный порядок с учётом весов; берём первый тип, который получился
    const order = menu.map(([name, w]) => [name, Math.pow(Math.random(), 1 / w)]).sort((a, b) => b[1] - a[1]);
    for (const [name] of order) {
      const q = GEN[name](e, P);
      if (q) { q.type = name; return q; }
    }
    return null;
  }

  function handQuestion(P, rec) {
    const e = rec.ref || { sec: P.sec, topic: null, item: null, idx: -1 };
    const q = question(e, "", rec.h.q, "plain", rec.h.a.map((label, i) => opt(label, "plain", i === 0)));
    q.type = "hand";
    return q;
  }

  function buildSection(sec, n) {
    const P = pool(sec);
    const qs = A.shuffle(P.hand).slice(0, Math.min(Math.round(n * HAND_SHARE), P.hand.length)).map((rec) => handQuestion(P, rec));
    for (let pass = 0; pass < 3 && qs.length < n; pass++) {
      for (const e of A.shuffle(P.entries)) {
        if (qs.length >= n) break;
        const q = auto(e, P);
        if (q && !qs.some((x) => x.text === q.text && x.prompt === q.prompt)) qs.push(q);
      }
    }
    return A.shuffle(qs).slice(0, n);
  }

  function tests() {
    return A.DATA.map((sec) => {
      const total = sec.topics.reduce((s, t) => s + t.items.length, 0);
      return { id: sec.id, title: sec.title, sec, count: Math.min(cfg.count, total), total };
    }).concat([{ id: "final", title: "Итоговый тест", sec: null, count: A.DATA.length * FINAL_PER_SECTION }]);
  }

  function start(testId, onlyQs) {
    const t = tests().find((x) => x.id === testId);
    if (!t) return;
    let qs = onlyQs;
    if (!qs) {
      qs = t.sec ? buildSection(t.sec, t.count)
        : A.shuffle(A.DATA.reduce((all, sec) => all.concat(buildSection(sec, FINAL_PER_SECTION)), []));
    }
    run = {
      id: t.id, title: t.title, secId: t.sec ? t.sec.id : null, qs, pos: 0,
      picks: qs.map(() => null), format: cfg.format, reveal: cfg.reveal,
      shown: false, t0: Date.now(), t1: null, practice: !!onlyQs,
    };
    view = "run";
    render();
    window.scrollTo(0, 0);
  }

  /* ---------- отрисовка ---------- */
  const show = (text, kind) => (kind === "latin" ? `<span class="lat" lang="la">${A.esc(text)}</span>` : kind === "rich" ? A.fmt(text) : A.esc(text));
  const correctOf = (q) => q.options.findIndex((o) => o.ok);
  const isRight = (q, pick) => pick != null && pick === correctOf(q);
  const fmtTime = (ms) => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + " мин " + (s % 60) + " с"; };

  function answerCard(q) {
    if (!q.item) return "";
    return `
      <div class="card mod-ans" data-sec="${q.sec.id}">
        <h2>${A.esc(q.item.n)}</h2>
        <span class="lat" lang="la">${A.esc(q.item.l)}</span>
        ${A.figure(A.imgTitle(q.sec, q.topic, q.idx), "pic-card")}
        ${A.itemBody(q.item)}
        <p class="mod-src"><a href="#/${q.sec.id}/${q.topic.id}/${q.idx}">Открыть в конспекте: ${A.esc(q.sec.title)} → ${A.esc(q.topic.title)}</a></p>
      </div>`;
  }
  const cardImages = (qs) => A.loadImages(qs.filter((q) => q.item).map((q) => A.imgTitle(q.sec, q.topic, q.idx)));

  function seg(name, value, options) {
    return `<div class="seg" role="group">${options.map(([v, label]) =>
      `<button data-cfg="${name}" data-val="${v}" class="${String(value) === String(v) ? "on" : ""}">${label}</button>`).join("")}</div>`;
  }

  function lastLine(id) {
    const h = hist[id];
    if (!h) return "Ещё не проходили";
    return `Последний результат: ${h.last.r} из ${h.last.t} (${pct(h.last.r, h.last.t)}%) · лучший: ${h.best}% · попыток: ${h.n}`;
  }

  function renderHome() {
    A.el.removeAttribute("data-sec");
    const list = tests();
    const pending = run && !run.t1;
    A.el.innerHTML = `
      <h1>Модуль</h1>
      <p class="lead">Тесты для подготовки к модулям и экзамену. Вопросы каждый раз выбираются заново и перемешиваются, после ответа показывается карточка с объяснением.</p>
      ${pending ? `<div class="mod-resume"><span>Есть незавершённый тест: ${A.esc(run.title)}, вопрос ${run.pos + 1} из ${run.qs.length}.</span>
        <button class="btn primary" id="resume">Продолжить</button></div>` : ""}
      <div class="mod-settings">
        <div><span>Вопросов в тесте раздела</span>${seg("count", cfg.count, [[20, "20"], [30, "30"], [50, "50"]])}</div>
        <div><span>Формат</span>${seg("format", cfg.format, [["mcq", "Варианты ответа"], ["cards", "Карточки"]])}</div>
        ${cfg.format === "mcq" ? `<div><span>Правильный ответ</span>${seg("reveal", cfg.reveal, [["now", "Сразу, с карточкой"], ["end", "В конце, как на экзамене"]])}</div>` : ""}
      </div>
      <div class="mod-grid">
        ${list.map((t) => `
          <article class="mod-card ${t.sec ? "" : "final"}" ${t.sec ? `data-sec="${t.sec.id}"` : ""}>
            <h2>${A.esc(t.title)}</h2>
            <p class="mod-meta">${t.sec
              ? `${t.count} вопросов · в разделе ${t.total} пунктов конспекта`
              : `${t.count} вопросов по всем разделам — по ${FINAL_PER_SECTION} из каждого`}</p>
            <p class="mod-last">${lastLine(t.id)}</p>
            <button class="btn primary" data-start="${t.id}">Начать тест</button>
          </article>`).join("")}
      </div>
      <p class="note mod-about">В тесты входят вопросы по всему конспекту, включая возрастные особенности: латинские названия, начало, прикрепление и иннервация мышц, связки и типы суставов, образования костей и органов, ветви сосудов. Результаты хранятся только в этом браузере.</p>`;

    A.el.querySelectorAll("[data-cfg]").forEach((b) => b.addEventListener("click", () => {
      cfg[b.dataset.cfg] = b.dataset.cfg === "count" ? +b.dataset.val : b.dataset.val;
      store(CFG_KEY, cfg);
      renderHome();
    }));
    A.el.querySelectorAll("[data-start]").forEach((b) => b.addEventListener("click", () => start(b.dataset.start)));
    const resume = A.el.querySelector("#resume");
    if (resume) resume.addEventListener("click", () => { view = "run"; render(); window.scrollTo(0, 0); });
  }

  function renderRun() {
    const r = run, q = r.qs[r.pos], pick = r.picks[r.pos];
    if (r.secId) A.el.setAttribute("data-sec", r.secId); else A.el.removeAttribute("data-sec");
    const cards = r.format === "cards";
    const instant = !cards && r.reveal === "now";
    const answered = pick != null;
    const last = r.pos + 1 === r.qs.length;
    const right = isRight(q, pick);
    const correct = q.options[correctOf(q)];

    let body;
    if (cards) {
      body = r.shown ? `
        <div class="mod-verdict">Правильный ответ: <b>${show(correct.label, correct.kind)}</b></div>
        ${answerCard(q)}
        <div class="actions"><button class="btn" id="no">Не знал</button><button class="btn primary" id="yes">Знал</button></div>`
        : `<div class="actions"><button class="btn primary" id="reveal">Показать ответ</button></div>`;
    } else {
      const done = instant && answered;
      body = `
        <div class="options">
          ${q.options.map((o, i) => {
            let cls = "";
            if (done) cls = o.ok ? "right" : i === pick ? "wrong" : "";
            else if (i === pick) cls = "picked";
            return `<button data-i="${i}" class="${cls}" ${done ? "disabled" : ""}><span class="num">${i + 1}</span><span>${show(o.label, o.kind)}</span></button>`;
          }).join("")}
        </div>
        ${done ? `<div class="mod-verdict ${right ? "ok" : "bad"}">${right ? "Верно." : `Неверно. Правильный ответ: <b>${show(correct.label, correct.kind)}</b>`}</div>${answerCard(q)}` : ""}
        ${answered ? `<div class="actions"><button class="btn primary" id="next">${last ? "Завершить и посмотреть результат" : "Дальше"}</button></div>` : ""}`;
    }

    A.el.innerHTML = `
      <div class="stage mod-run">
        <div class="mod-top">
          <span>${A.esc(r.title)}${r.practice ? " · работа над ошибками" : ""} · вопрос ${r.pos + 1} из ${r.qs.length}</span>
          <button class="btn ghost small" id="quit">Закончить</button>
        </div>
        <div class="bar"><i style="width:${Math.round((r.pos / r.qs.length) * 100)}%"></i></div>
        ${r.secId ? "" : `<div class="mod-sec" data-sec="${q.sec.id}">${A.esc(q.sec.title)}</div>`}
        ${q.prompt ? `<p class="quiz-sub">${A.esc(q.prompt)}</p>` : ""}
        <p class="quiz-q">${show(q.text, q.kind)}</p>
        ${body}
      </div>`;

    const go = () => {
      r.shown = false;
      if (last) finish(); else { r.pos++; render(); window.scrollTo(0, 0); }
    };
    A.el.querySelectorAll(".options button").forEach((b) => b.addEventListener("click", () => {
      r.picks[r.pos] = +b.dataset.i;
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    }));
    const on = (id, fn) => { const el = A.el.querySelector(id); if (el) el.addEventListener("click", fn); return el; };
    on("#next", go);
    on("#reveal", () => { r.shown = true; render(); });
    on("#yes", () => { r.picks[r.pos] = correctOf(q); go(); });
    on("#no", () => { r.picks[r.pos] = -1; go(); });
    on("#quit", () => {
      const doneCount = r.picks.filter((p) => p != null).length;
      if (!doneCount) { run = null; view = "home"; render(); return; }
      if (!window.confirm("Закончить тест сейчас? Результат посчитается по тем вопросам, на которые вы ответили.")) return;
      const keep = r.qs.map((_, i) => i).filter((i) => r.picks[i] != null);
      r.qs = keep.map((i) => r.qs[i]);
      r.picks = keep.map((i) => r.picks[i]);
      r.partial = true;
      finish();
    });
    if ((instant && answered) || (cards && r.shown)) cardImages([q]);
  }

  function finish() {
    const r = run;
    r.t1 = Date.now();
    r.right = r.qs.filter((q, i) => isRight(q, r.picks[i])).length;
    if (!r.partial && !r.practice) {
      const p = pct(r.right, r.qs.length);
      const h = hist[r.id] || { n: 0, best: 0 };
      hist[r.id] = { n: h.n + 1, best: Math.max(h.best, p), last: { r: r.right, t: r.qs.length, at: r.t1 } };
      store(HIST_KEY, hist);
    }
    view = "result";
    render();
    window.scrollTo(0, 0);
  }

  function breakdown(r) {
    const groups = new Map();
    r.qs.forEach((q, i) => {
      const final = !r.secId;
      const key = final ? q.sec.id : q.topic ? q.topic.id : "?";
      if (!groups.has(key)) {
        groups.set(key, {
          title: final ? q.sec.title : q.topic ? q.topic.title : "Другое",
          href: final ? "#/" + q.sec.id : q.topic ? "#/" + q.sec.id + "/" + q.topic.id : "#/" + q.sec.id,
          sec: q.sec.id, r: 0, t: 0,
        });
      }
      const g = groups.get(key);
      g.t++;
      if (isRight(q, r.picks[i])) g.r++;
    });
    return Array.from(groups.values()).sort((a, b) => a.r / a.t - b.r / b.t);
  }

  function aiDraft(r, wrong) {
    const lines = wrong.slice(0, 10).map(({ q, i }, n) => {
      const mine = r.picks[i] >= 0 && q.options[r.picks[i]] ? q.options[r.picks[i]].label : "не знал";
      return `${n + 1}. ${q.prompt ? q.prompt + " " : ""}${q.text}\n   Мой ответ: ${mine}\n   Правильный ответ: ${q.options[correctOf(q)].label}`;
    });
    return `Я прошёл тест «${r.title}» и ошибся в этих вопросах. Разбери каждый коротко: почему верен правильный ответ и как это запомнить.\n\n${lines.join("\n\n")}`;
  }

  function renderResult() {
    const r = run;
    if (r.secId) A.el.setAttribute("data-sec", r.secId); else A.el.removeAttribute("data-sec");
    const total = r.qs.length, p = pct(r.right, total);
    const wrong = r.qs.map((q, i) => ({ q, i })).filter(({ q, i }) => !isRight(q, r.picks[i]));
    const verdict = p >= 90 ? "Отличный результат." : p >= 75 ? "Хороший результат. Повторите темы с ошибками."
      : p >= 60 ? "Неплохо, но есть пробелы — посмотрите слабые темы ниже." : "Пока слабо. Пройдите конспект и карточки по слабым темам и попробуйте снова.";

    A.el.innerHTML = `
      <div class="stage">
        <div class="empty mod-result">
          <div class="mod-title">${A.esc(r.title)}${r.practice ? " · работа над ошибками" : ""}${r.partial ? " · завершён досрочно" : ""}</div>
          <div class="big">${r.right} из ${total} · ${p}%</div>
          <p>${verdict}</p>
          <p class="note">Время: ${fmtTime(r.t1 - r.t0)}${r.partial || r.practice ? " · в историю не записан" : ""}</p>
          <div class="actions">
            <button class="btn primary" id="again">Новый тест</button>
            ${wrong.length ? `<button class="btn" id="redo">Повторить ошибки (${wrong.length})</button><button class="btn" id="ai">Разобрать ошибки с ИИ</button>` : ""}
            <button class="btn ghost" id="home">К списку тестов</button>
          </div>
        </div>

        <h2 class="mod-h">${r.secId ? "По темам" : "По разделам"}</h2>
        <div class="mod-break">
          ${breakdown(r).map((g) => `
            <a href="${g.href}" data-sec="${g.sec}">
              <span>${A.esc(g.title)}</span>
              <span class="bar"><i style="width:${pct(g.r, g.t)}%"></i></span>
              <span class="count ${g.r === g.t ? "done" : ""}">${g.r}/${g.t}</span>
            </a>`).join("")}
        </div>

        ${wrong.length ? `<h2 class="mod-h">Ошибки</h2>` : ""}
        ${wrong.map(({ q, i }) => {
          const pick = r.picks[i];
          const mine = pick >= 0 && q.options[pick] ? show(q.options[pick].label, q.options[pick].kind) : "не знал";
          const ok = q.options[correctOf(q)];
          return `
            <details class="mistake" data-sec="${q.sec.id}">
              <summary>
                ${q.prompt ? `<small>${A.esc(q.prompt)}</small>` : ""}
                <b>${show(q.text, q.kind)}</b>
                <span class="m-bad">Ваш ответ: ${mine}</span>
                <span class="m-ok">Правильно: ${show(ok.label, ok.kind)}</span>
              </summary>
              ${answerCard(q) || `<p class="note">Карточки для этого вопроса нет.</p>`}
            </details>`;
        }).join("")}
      </div>`;

    const on = (id, fn) => { const el = A.el.querySelector(id); if (el) el.addEventListener("click", fn); };
    on("#again", () => start(r.id));
    on("#redo", () => start(r.id, wrong.map(({ q }) => Object.assign({}, q, { options: A.shuffle(q.options) }))));
    on("#home", () => { view = "home"; render(); window.scrollTo(0, 0); });
    on("#ai", () => {
      try { sessionStorage.setItem("anatomy-ai-draft", aiDraft(r, wrong)); } catch (e) { /* без черновика */ }
      location.hash = "#/ai";
    });
    A.el.querySelectorAll("details.mistake").forEach((d, n) => d.addEventListener("toggle", () => { if (d.open) cardImages([wrong[n].q]); }));
  }

  function render() {
    A = window.APP;
    if (view === "run" && run && !run.t1) renderRun();
    else if (view === "result" && run && run.t1) renderResult();
    else { view = "home"; renderHome(); }
  }

  // цифры 1–4 выбирают вариант, Enter — «Дальше»
  document.addEventListener("keydown", (e) => {
    if (view !== "run" || !/^#\/module/.test(location.hash) || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key >= "1" && e.key <= "4") {
      const b = document.querySelector(`.mod-run .options button[data-i="${+e.key - 1}"]:not(:disabled)`);
      if (b) b.click();
    } else if (e.key === "Enter") {
      const b = document.querySelector(".mod-run #next, .mod-run #reveal");
      if (b) { e.preventDefault(); b.click(); }
    }
  });

  // Ссылка «Модуль» в меню и на главной всегда ведёт к списку тестов; незавершённый тест остаётся и предлагается продолжить.
  // Возврат кнопкой «Назад» (например, из ИИ-помощника) показывает то, что было: тест или результат.
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href="#/module"]');
    if (!a) return;
    view = "home";
    if (location.hash === "#/module") { render(); window.scrollTo(0, 0); }
  });

  PAGES.module = render;
  // для автотестов и отладки
  window.APP_MODULE = {
    pool: (sec) => { A = window.APP; return pool(sec); },
    buildSection: (sec, n) => { A = window.APP; return buildSection(sec, n); },
  };
})();
