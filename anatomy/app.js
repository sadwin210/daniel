(function () {
  "use strict";

  const DATA = window.ANATOMY || [];
  const app = document.getElementById("app");
  const topNav = document.getElementById("topNav");
  const searchInput = document.getElementById("search");

  const FIELDS = [
    ["s", "Суставные поверхности"],
    ["t", "Тип сустава"],
    ["m", "Движения"],
    ["g", "Связки"],
    ["o", "Начало"],
    ["i", "Прикрепление"],
    ["f", "Функция"],
    ["v", "Иннервация"],
  ];

  /* ---------- прогресс (localStorage) ---------- */
  const STORE = "anatomy-learned-v1";
  let learned = {};
  try { learned = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { learned = {}; }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(learned)); } catch (e) { /* без сохранения */ } };
  const key = (sec, topic, idx) => sec.id + "/" + topic.id + "/" + idx;
  const isLearned = (sec, topic, idx) => !!learned[key(sec, topic, idx)];
  const setLearned = (sec, topic, idx, on) => {
    if (on) learned[key(sec, topic, idx)] = 1; else delete learned[key(sec, topic, idx)];
    save();
  };
  const topicDone = (sec, topic) => topic.items.filter((_, i) => isLearned(sec, topic, i)).length;
  const sectionStats = (sec) => {
    let done = 0, total = 0;
    sec.topics.forEach((t) => { done += topicDone(sec, t); total += t.items.length; });
    return { done, total };
  };

  /* ---------- утилиты ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const findSection = (id) => DATA.find((s) => s.id === id);

  /* ---------- иллюстрации из Википедии ---------- */
  const IMG = window.ANATOMY_IMG || { sections: {}, topics: {} };
  const IMG_STORE = "anatomy-img-v1";
  const API = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=500";
  let imgCache = {};
  try { imgCache = JSON.parse(localStorage.getItem(IMG_STORE)) || {}; } catch (e) { imgCache = {}; }
  const imgFailed = {};   // не найдено в этой сессии
  const imgPending = {};  // запрос уже отправлен
  const imgTitle = (sec, topic, idx) => (IMG.topics[sec.id + "/" + topic.id] || [])[idx];

  function figure(title, cls) {
    if (!title || imgFailed[title]) return "";
    const c = imgCache[title];
    const inner = c
      ? `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(c.page.replace(/ /g, "_"))}" target="_blank" rel="noopener" title="Открыть статью и сведения об изображении">
           <img src="${esc(c.src)}" width="${c.w}" height="${c.h}" alt="" loading="lazy" onerror="this.closest('figure').remove()">
         </a><figcaption>Википедия</figcaption>`
      : `<div class="pic-wait"></div>`;
    return `<figure class="pic ${cls || ""}" data-img="${esc(title)}">${inner}</figure>`;
  }

  function storeImage(title, page) {
    if (page && page.thumbnail) {
      imgCache[title] = { src: page.thumbnail.source, w: page.thumbnail.width, h: page.thumbnail.height, page: page.title };
      return true;
    }
    return false;
  }

  function fetchBatch(titles) {
    return fetch(API + "&redirects=1&pilimit=50&titles=" + encodeURIComponent(titles.join("|")))
      .then((r) => r.json())
      .then((r) => {
        const q = r.query || {};
        const norm = {}, red = {}, pages = {};
        (q.normalized || []).forEach((x) => { norm[x.from] = x.to; });
        (q.redirects || []).forEach((x) => { red[x.from] = x.to; });
        Object.keys(q.pages || {}).forEach((id) => { pages[q.pages[id].title] = q.pages[id]; });
        return titles.filter((t) => {
          let f = norm[t] || t; f = red[f] || f;
          return !storeImage(t, pages[f]);
        });
      });
  }

  // запасной путь: поиск статьи по названию, если точного совпадения или картинки нет
  function fetchBySearch(title) {
    return fetch(API + "&generator=search&gsrlimit=3&gsrsearch=" + encodeURIComponent(title))
      .then((r) => r.json())
      .then((r) => {
        const pages = Object.values((r.query || {}).pages || {}).sort((a, b) => a.index - b.index);
        if (!pages.some((p) => storeImage(title, p))) imgFailed[title] = 1;
      })
      .catch(() => { imgFailed[title] = 1; });
  }

  function hydrate() {
    document.querySelectorAll("figure.pic[data-img]").forEach((el) => {
      const t = el.dataset.img;
      if (imgFailed[t]) { el.remove(); return; }
      if (imgCache[t] && el.querySelector(".pic-wait")) el.outerHTML = figure(t, el.className.replace("pic", "").trim());
    });
  }

  function loadImages(titles) {
    const need = Array.from(new Set(titles.filter((t) => t && !imgCache[t] && !imgFailed[t] && !imgPending[t])));
    if (!need.length || typeof fetch !== "function") return;
    need.forEach((t) => { imgPending[t] = 1; });
    const jobs = [];
    for (let i = 0; i < need.length; i += 50) {
      const batch = need.slice(i, i + 50);
      jobs.push(fetchBatch(batch)
        .then((missing) => Promise.all(missing.map(fetchBySearch)))
        .catch(() => { batch.forEach((t) => { if (!imgCache[t]) imgFailed[t] = 1; }); }));
    }
    Promise.all(jobs).then(() => {
      need.forEach((t) => { delete imgPending[t]; });
      try { localStorage.setItem(IMG_STORE, JSON.stringify(imgCache)); } catch (e) { /* без кэша */ }
      hydrate();
    });
  }

  function itemBody(item) {
    let h = "";
    if (item.d && !item.o && !item.s) h += `<p>${esc(item.d)}</p>`;
    const rows = FIELDS.filter(([k]) => item[k]).map(([k, label]) => `<dt>${label}</dt><dd>${esc(item[k])}</dd>`).join("");
    if (rows) h += `<dl class="fields">${rows}</dl>`;
    if (item.p) h += `<ul>${item.p.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    if (item.d && (item.o || item.s)) h += `<p class="note">${esc(item.d)}</p>`;
    return h;
  }

  function renderNav(activeId) {
    topNav.innerHTML = DATA.map((s) =>
      `<a href="#/${s.id}" data-sec="${s.id}" class="${s.id === activeId ? "on" : ""}">${s.title}</a>`).join("");
  }

  function countBadge(done, total) {
    return `<span class="count ${done === total ? "done" : ""}">${done}/${total}</span>`;
  }

  /* ---------- главная и раздел ---------- */
  function columnHtml(sec) {
    const st = sectionStats(sec);
    const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
    return `
      <section class="col" data-sec="${sec.id}">
        ${figure(IMG.sections[sec.id], "pic-sec")}
        <div class="col-head">
          <h2><a href="#/${sec.id}">${sec.icon} ${sec.title}</a></h2>
          <p><span class="lat">${sec.lat}</span> — ${sec.about.toLowerCase()}</p>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="bar-label">Выучено ${st.done} из ${st.total}</div>
        </div>
        <ul class="topics">
          ${sec.topics.map((t) => `
            <li><a href="#/${sec.id}/${t.id}">
              <span class="t-name"><b>${esc(t.title)}</b><small>${esc(t.note)}</small></span>
              ${countBadge(topicDone(sec, t), t.items.length)}
            </a></li>`).join("")}
        </ul>
      </section>`;
  }

  function renderHome() {
    renderNav(null);
    document.title = "Анатомия — учебник по разделам";
    app.removeAttribute("data-sec");
    app.innerHTML = `
      <h1>Анатомия по разделам</h1>
      <p class="lead">Выберите раздел и тему. В каждой теме — конспект с латинскими терминами, карточки для самопроверки и тест.</p>
      <div class="columns">${DATA.map(columnHtml).join("")}</div>`;
    loadImages(DATA.map((s) => IMG.sections[s.id]));
  }

  function renderSection(sec) {
    renderNav(sec.id);
    document.title = sec.title + " — Анатомия";
    app.setAttribute("data-sec", sec.id);
    app.innerHTML = `
      <div class="crumbs"><a href="#/">Все разделы</a> / ${sec.title}</div>
      <div class="columns" style="grid-template-columns:minmax(0,640px)">${columnHtml(sec)}</div>`;
    loadImages([IMG.sections[sec.id]]);
  }

  /* ---------- тема ---------- */
  let mode = "read";
  let session = null; // состояние карточек или теста

  function renderTopic(sec, topic, focusIdx) {
    renderNav(sec.id);
    document.title = topic.title + " — " + sec.title;
    app.setAttribute("data-sec", sec.id);
    const done = topicDone(sec, topic);
    app.innerHTML = `
      <div class="layout">
        <aside class="side">
          <h3>${sec.title}</h3>
          ${sec.topics.map((t) => `
            <a href="#/${sec.id}/${t.id}" class="${t.id === topic.id ? "on" : ""}">
              <span>${esc(t.title)}</span><span>${topicDone(sec, t)}/${t.items.length}</span>
            </a>`).join("")}
        </aside>
        <div>
          <div class="crumbs"><a href="#/">Все разделы</a> / <a href="#/${sec.id}">${sec.title}</a></div>
          <h1>${esc(topic.title)}</h1>
          <p class="lead" style="margin-bottom:0">${esc(topic.note)} · выучено ${done} из ${topic.items.length}</p>
          <div class="tabs" role="tablist">
            <button data-mode="read" class="${mode === "read" ? "on" : ""}">Конспект</button>
            <button data-mode="cards" class="${mode === "cards" ? "on" : ""}">Карточки</button>
            <button data-mode="quiz" class="${mode === "quiz" ? "on" : ""}">Тест</button>
          </div>
          <div id="view"></div>
        </div>
      </div>`;

    app.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
      mode = b.dataset.mode;
      session = null;
      renderTopic(sec, topic);
    }));

    const view = document.getElementById("view");
    if (mode === "cards") renderCards(view, sec, topic);
    else if (mode === "quiz") renderQuiz(view, sec, topic);
    else renderRead(view, sec, topic, focusIdx);

    loadImages(topic.items.map((_, i) => imgTitle(sec, topic, i)));

    const on = app.querySelector(".side a.on");
    if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "center" });
  }

  function renderRead(view, sec, topic, focusIdx) {
    view.innerHTML = topic.items.map((item, i) => {
      const ok = isLearned(sec, topic, i);
      return `
        <article class="item ${ok ? "learned" : ""}" id="item-${i}">
          <div class="item-head">
            <div>
              <h2>${esc(item.n)}</h2>
              <span class="lat" lang="la">${esc(item.l)}</span>
            </div>
            <button class="check" data-i="${i}" aria-pressed="${ok}">${ok ? "✓ Выучено" : "Отметить"}</button>
          </div>
          <div class="item-body">
            <div>${itemBody(item)}</div>
            ${figure(imgTitle(sec, topic, i))}
          </div>
        </article>`;
    }).join("");

    view.querySelectorAll(".check").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.i;
      setLearned(sec, topic, i, !isLearned(sec, topic, i));
      const y = window.scrollY;
      renderTopic(sec, topic);
      window.scrollTo(0, y);
    }));

    if (focusIdx != null) {
      const el = document.getElementById("item-" + focusIdx);
      if (el) { el.classList.add("hit"); el.scrollIntoView({ block: "start" }); }
    }
  }

  /* ---------- карточки ---------- */
  function renderCards(view, sec, topic) {
    if (!session || session.type !== "cards") {
      const all = topic.items.map((_, i) => i);
      const pending = all.filter((i) => !isLearned(sec, topic, i));
      session = { type: "cards", queue: shuffle(pending.length ? pending : all), flipped: false, total: 0, onlyNew: pending.length > 0 };
      session.total = session.queue.length;
    }
    const s = session;

    if (!s.queue.length) {
      view.innerHTML = `
        <div class="stage"><div class="empty">
          <div class="big">Тема пройдена</div>
          <p>Все карточки отмечены как выученные.</p>
          <div class="actions">
            <button class="btn primary" id="again">Повторить всю тему</button>
            <button class="btn" id="toQuiz">Пройти тест</button>
          </div>
        </div></div>`;
      view.querySelector("#again").addEventListener("click", () => {
        session = { type: "cards", queue: shuffle(topic.items.map((_, i) => i)), flipped: false, total: topic.items.length };
        renderTopic(sec, topic);
      });
      view.querySelector("#toQuiz").addEventListener("click", () => { mode = "quiz"; session = null; renderTopic(sec, topic); });
      return;
    }

    const idx = s.queue[0];
    const item = topic.items[idx];
    const left = s.queue.length;
    view.innerHTML = `
      <div class="stage">
        <div class="progress-line">Осталось карточек: ${left} из ${s.total}${s.onlyNew ? " · только невыученные" : ""}</div>
        ${s.flipped ? `
          <div class="card">
            <h2>${esc(item.n)}</h2>
            <span class="lat" lang="la">${esc(item.l)}</span>
            ${figure(imgTitle(sec, topic, idx), "pic-card")}
            ${itemBody(item)}
          </div>
          <div class="actions">
            <button class="btn" id="repeat">Ещё повторить</button>
            <button class="btn primary" id="know">Знаю</button>
          </div>` : `
          <button class="card front" id="flip">
            <span class="q">${esc(item.n)}</span>
            <span class="hint">Вспомните латинское название и всё, что знаете. Нажмите, чтобы проверить.</span>
          </button>`}
      </div>`;

    const rerender = () => { const y = window.scrollY; renderTopic(sec, topic); window.scrollTo(0, y); };
    if (!s.flipped) {
      view.querySelector("#flip").addEventListener("click", () => { s.flipped = true; rerender(); });
    } else {
      view.querySelector("#know").addEventListener("click", () => {
        setLearned(sec, topic, idx, true);
        s.queue.shift(); s.flipped = false; rerender();
      });
      view.querySelector("#repeat").addEventListener("click", () => {
        setLearned(sec, topic, idx, false);
        s.queue.push(s.queue.shift()); s.flipped = false; rerender();
      });
    }
  }

  /* ---------- тест ---------- */
  function buildQuestions(sec, topic) {
    const pool = [];
    sec.topics.forEach((t) => t.items.forEach((it) => pool.push(it)));
    const pick = (correct, prop) => {
      const others = shuffle(pool.filter((x) => x[prop] !== correct[prop])).slice(0, 3);
      return shuffle([correct].concat(others));
    };
    const qs = [];
    topic.items.forEach((item) => {
      const toLatin = Math.random() < 0.5;
      qs.push(toLatin
        ? { text: item.n, sub: "Как это называется по-латыни?", options: pick(item, "l"), show: "l", item }
        : { text: item.l, sub: "Что это по-русски?", options: pick(item, "n"), show: "n", latinQ: true, item });
      if (item.f) qs.push({ text: item.f, sub: "Какая мышца выполняет эту функцию?", options: pick(item, "n"), show: "n", item });
      if (item.t && item.s) qs.push({ text: item.t, sub: "Какому суставу соответствует эта характеристика?", options: pick(item, "n"), show: "n", item });
    });
    return shuffle(qs).slice(0, 12);
  }

  function renderQuiz(view, sec, topic) {
    if (!session || session.type !== "quiz") {
      session = { type: "quiz", qs: buildQuestions(sec, topic), pos: 0, right: 0, answered: null, mistakes: [] };
    }
    const s = session;
    const rerender = () => { const y = window.scrollY; renderTopic(sec, topic); window.scrollTo(0, y); };

    if (s.pos >= s.qs.length) {
      const pct = Math.round((s.right / s.qs.length) * 100);
      view.innerHTML = `
        <div class="stage"><div class="empty">
          <div class="big">${s.right} из ${s.qs.length} (${pct}%)</div>
          <p>${pct === 100 ? "Без ошибок." : pct >= 70 ? "Хороший результат. Повторите пункты с ошибками." : "Стоит ещё раз пройти конспект и карточки."}</p>
          ${s.mistakes.length ? `<p class="note">Повторить: ${s.mistakes.map((m) => esc(m.n)).join("; ")}.</p>` : ""}
          <div class="actions">
            <button class="btn primary" id="again">Пройти ещё раз</button>
            <button class="btn" id="toRead">К конспекту</button>
          </div>
        </div></div>`;
      view.querySelector("#again").addEventListener("click", () => { session = null; rerender(); });
      view.querySelector("#toRead").addEventListener("click", () => { mode = "read"; session = null; renderTopic(sec, topic); });
      return;
    }

    const q = s.qs[s.pos];
    view.innerHTML = `
      <div class="stage">
        <div class="progress-line">Вопрос ${s.pos + 1} из ${s.qs.length} · верно: ${s.right}</div>
        <p class="quiz-q ${q.latinQ ? "lat" : ""}">${esc(q.text)}</p>
        <p class="quiz-sub">${q.sub}</p>
        <div class="options">
          ${q.options.map((o, i) => {
            let cls = "";
            if (s.answered != null) {
              if (o === q.item) cls = "right"; else if (i === s.answered) cls = "wrong";
            }
            return `<button data-i="${i}" class="${cls} ${q.show === "l" ? "lat" : ""}" ${s.answered != null ? "disabled" : ""}>${esc(o[q.show])}</button>`;
          }).join("")}
        </div>
        ${s.answered != null ? `<div class="actions"><button class="btn primary" id="next">${s.pos + 1 === s.qs.length ? "Результат" : "Дальше"}</button></div>` : ""}
      </div>`;

    view.querySelectorAll(".options button").forEach((b) => b.addEventListener("click", () => {
      s.answered = +b.dataset.i;
      if (q.options[s.answered] === q.item) s.right++;
      else if (s.mistakes.indexOf(q.item) < 0) s.mistakes.push(q.item);
      rerender();
    }));
    const next = view.querySelector("#next");
    if (next) {
      next.addEventListener("click", () => { s.pos++; s.answered = null; rerender(); });
      next.focus();
    }
  }

  /* ---------- поиск ---------- */
  function renderSearch(query) {
    renderNav(null);
    app.removeAttribute("data-sec");
    const q = query.trim().toLowerCase();
    const hits = [];
    DATA.forEach((sec) => sec.topics.forEach((topic) => topic.items.forEach((item, i) => {
      const inName = (item.n + " " + item.l).toLowerCase().indexOf(q) >= 0;
      const inText = !inName && JSON.stringify(item).toLowerCase().indexOf(q) >= 0;
      if (inName || inText) hits.push({ sec, topic, item, i, rank: inName ? 0 : 1 });
    })));
    hits.sort((a, b) => a.rank - b.rank);
    app.innerHTML = `
      <h1>Поиск</h1>
      <p class="lead">${hits.length ? "Найдено: " + hits.length : "Ничего не найдено. Попробуйте другое слово — по-русски или по-латыни."}</p>
      <div class="results">
        ${hits.slice(0, 60).map((h) => `
          <a href="#/${h.sec.id}/${h.topic.id}/${h.i}" data-sec="${h.sec.id}">
            <b>${esc(h.item.n)}</b> <span class="lat">${esc(h.item.l)}</span>
            <small>${h.sec.title} → ${esc(h.topic.title)}</small>
          </a>`).join("")}
      </div>`;
  }

  /* ---------- маршрутизация ---------- */
  let lastTopicKey = null;

  function route() {
    const q = searchInput.value.trim();
    if (q.length >= 2) { renderSearch(q); return; }

    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const sec = findSection(parts[0]);
    if (!sec) { lastTopicKey = null; renderHome(); window.scrollTo(0, 0); return; }
    const topic = sec.topics.find((t) => t.id === parts[1]);
    if (!topic) { lastTopicKey = null; renderSection(sec); window.scrollTo(0, 0); return; }

    const k = sec.id + "/" + topic.id;
    const focus = parts[2] != null ? +parts[2] : null;
    if (k !== lastTopicKey || focus != null) { session = null; if (focus != null) mode = "read"; }
    const changed = k !== lastTopicKey;
    lastTopicKey = k;
    renderTopic(sec, topic, focus);
    if (changed && focus == null) window.scrollTo(0, 0);
  }

  searchInput.addEventListener("input", route);
  window.addEventListener("hashchange", () => { searchInput.value = ""; route(); });
  document.addEventListener("click", (e) => {
    // переход по результату поиска на ту же страницу: сбрасываем строку поиска
    const a = e.target.closest && e.target.closest(".results a");
    if (a) { searchInput.value = ""; if (a.getAttribute("href") === location.hash) route(); }
  });

  route();
})();
