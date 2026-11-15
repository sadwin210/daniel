/* Раздел «ИИ-помощник».
   Без ключа: находит нужные пункты конспекта и открывает вопрос в Claude (claude.ai) в новой вкладке.
   С ключом API: отвечает прямо на странице через официальную библиотеку Anthropic (vendor/anthropic-sdk.js).
   Ключ хранится только в этом браузере и отправляется только на api.anthropic.com. */
(function () {
  "use strict";

  const PAGES = (window.APP_PAGES = window.APP_PAGES || {});
  const KEY_STORE = "anatomy-ai-key";
  const MODEL_STORE = "anatomy-ai-model";
  const DRAFT_STORE = "anatomy-ai-draft";
  const SDK_SRC = "vendor/anthropic-sdk.js?v=1.8.0";
  const MAX_TOKENS = 8000;      // с запасом на размышление модели; ответы помощника короткие
  const HISTORY_TURNS = 12;     // сколько последних сообщений отправлять вместе с вопросом
  const FALLBACK_BETA = "server-side-fallback-2026-07-01";

  // fallbacks: при отказе защитного фильтра запрос автоматически повторяется на резервной модели
  const MODELS = [
    { id: "claude-opus-5-5", name: "Claude Opus 5.5", hint: "самая точная, по умолчанию", fallbacks: true },
    { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", hint: "быстрее и примерно вдвое дешевле", fallbacks: true },
    { id: "claude-haiku-5-5", name: "Claude Haiku 5.5", hint: "самая быстрая и дешёвая", fallbacks: false },
  ];

  const SYSTEM = [
    "Ты — помощник по анатомии человека для студента педиатрического факультета медицинского вуза. Он готовится к модулям и экзамену по анатомии.",
    "",
    "Как отвечать:",
    "— по-русски и по существу; анатомические структуры называй по-русски и давай латинский термин в скобках;",
    "— начинай с прямого ответа, затем короткое объяснение; длинные перечисления оформляй списком;",
    "— где это уместно, отмечай возрастные особенности (новорождённый, ребёнок): студент учится на педиатра;",
    "— если студент просит проверить его знания, задавай вопросы по одному и разбирай его ответы;",
    "— если источники расходятся (сроки, уровни, варианты строения) или ты не уверен, скажи об этом прямо и посоветуй свериться с учебником кафедры;",
    "— не используй таблицы: ответ показывается в узком окне чата.",
    "",
    "К вопросу могут быть приложены выдержки из конспекта студента в тегах <конспект>. Опирайся на них, чтобы термины совпадали с тем, что он учит; если в выдержке ошибка — поправь её и объясни. Если выдержки к вопросу не относятся, не упоминай их.",
  ].join("\n");

  const EXAMPLES = [
    "Объясни простыми словами, как устроен коленный сустав",
    "Как запомнить ветви наружной сонной артерии?",
    "Чем череп новорождённого отличается от черепа взрослого?",
    "Задай мне 5 вопросов по мышцам плеча и проверь ответы",
  ];

  let A = null;
  let chat = [];        // { role, text, ctx, state: "done" | "stream" | "error" | "manual", note }
  let busy = false;
  let active = null;    // текущий поток ответа (для кнопки «Остановить»)
  let sdkPromise = null;

  const get = (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } };
  const set = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* без сохранения */ } };
  const modelOf = () => MODELS.find((m) => m.id === get(MODEL_STORE)) || MODELS[0];

  /* ---------- поиск по конспекту ---------- */
  const STOP = new Set(["как", "что", "это", "для", "или", "при", "где", "чем", "его", "она", "они", "мне", "мой", "моя", "про", "над", "под",
    "какой", "какая", "какие", "какое", "какую", "объясни", "расскажи", "почему", "зачем", "когда", "можно", "нужно", "такое", "между",
    "простыми", "словами", "запомнить", "вопрос", "вопроса", "вопросов", "ответ", "ответы", "задай", "проверь", "очень", "есть", "чтобы",
    // общие анатомические слова: сами по себе тему не определяют
    "мышца", "мышцы", "мышцу", "мышц", "мышцей", "мышцам", "кость", "кости", "костей", "костью", "сустав", "сустава", "суставы", "суставов",
    "артерия", "артерии", "артерий", "вена", "вены", "нерв", "нерва", "нервы", "нервом", "связка", "связки", "связок",
    "иннервируется", "иннервирует", "иннервация", "строение", "устроен", "устроена", "функция", "функции", "находится", "проходит",
    "через", "привет", "спасибо", "пожалуйста", "человека", "анатомия", "анатомии", "называется", "относится", "отличается", "будет", "повреждении"]);
  const norm = (s) => String(s).toLowerCase().replace(/ё/g, "е");
  // Поиск устойчив к окончаниям: «сонной» находит «сонная», «родничок» — «роднички».
  const ENDINGS = ["ого", "его", "ому", "ему", "ыми", "ими", "ами", "ями", "ая", "яя", "ой", "ей", "ый", "ий", "ое", "ее", "ые", "ие",
    "ую", "юю", "ом", "ем", "ах", "ях", "ов", "ев", "ам", "ям", "ы", "и", "а", "я", "у", "ю", "е", "о", "ь", "й"];
  const words = (s) => norm(s).split(/[^a-zа-я0-9]+/).filter((w) => w.length >= 3);
  function stem(w) {
    if (/^[a-z0-9]+$/.test(w)) return w;
    for (const e of ENDINGS) if (w.length - e.length >= 4 && w.endsWith(e)) return w.slice(0, -e.length);
    return w;
  }
  function same(a, b) {
    if (a === b) return true;
    const s = a.length <= b.length ? a : b, l = s === a ? b : a;
    let c = 0;
    while (c < s.length && s[c] === l[c]) c++;
    if (c === s.length && s.length >= 4 && l.length - s.length <= 2) return true; // одно слово — начало другого
    return s.length >= 7 && l.length - s.length <= 1 && c >= s.length - 1;       // отличие в последней букве
  }

  let index = null, vocab = null;
  function buildIndex() {
    index = [];
    vocab = new Map(); // основа слова -> { head, body, topic }: номера пунктов
    const add = (text, kind, i) => words(text).forEach((w) => {
      const st = stem(w);
      if (!vocab.has(st)) vocab.set(st, { head: new Set(), body: new Set(), topic: new Set() });
      vocab.get(st)[kind].add(i);
    });
    A.DATA.forEach((sec) => sec.topics.forEach((topic) => topic.items.forEach((item, idx) => {
      const i = index.length;
      index.push({ sec, topic, item, idx });
      add(item.n + " " + item.l, "head", i);
      add(JSON.stringify(item), "body", i);
      add(topic.title, "topic", i);
    })));
  }

  function retrieve(query, limit) {
    if (!index) buildIndex();
    const stems = Array.from(new Set(words(query).filter((w) => !STOP.has(w)).map(stem)));
    const score = new Map();
    const bump = (i, v) => score.set(i, (score.get(i) || 0) + v);
    stems.forEach((q) => {
      const head = new Set(), body = new Set(), topic = new Set();
      vocab.forEach((sets, st) => {
        if (!same(q, st)) return;
        sets.head.forEach((i) => head.add(i));
        sets.body.forEach((i) => body.add(i));
        sets.topic.forEach((i) => topic.add(i));
      });
      // редкое слово важнее частого («нефрон» важнее, чем «большой»)
      const df = new Set([...head, ...body]).size;
      if (!df) return;
      const wHead = df <= 8 ? 6 : df <= 30 ? 4 : 2, wBody = df <= 8 ? 3 : df <= 30 ? 1 : 0.3;
      body.forEach((i) => bump(i, head.has(i) ? wHead : wBody));
      topic.forEach((i) => bump(i, 1.5));
    });
    const ranked = Array.from(score.entries()).sort((x, y) => y[1] - x[1]);
    if (!ranked.length) return [];
    const floor = Math.max(2.5, ranked[0][1] * 0.6);
    return ranked.filter((x) => x[1] >= floor).slice(0, limit || 5).map((x) => index[x[0]]);
  }

  const FIELD_NAMES = { s: "Суставные поверхности", t: "Тип сустава", m: "Движения", g: "Связки", o: "Начало", i: "Прикрепление", f: "Функция", v: "Иннервация" };
  function plain(e) {
    const it = e.item;
    const lines = [`${it.n} (${it.l}) — ${e.sec.title}, тема «${e.topic.title}»`];
    if (it.d) lines.push(it.d);
    Object.keys(FIELD_NAMES).forEach((k) => { if (it[k]) lines.push(FIELD_NAMES[k] + ": " + it[k]); });
    (it.p || []).forEach((x) => lines.push("• " + x));
    return lines.join("\n");
  }
  const contextText = (ctx) => ctx.map(plain).join("\n\n");

  // запрос для вставки в любой чат с ИИ
  function fullPrompt(question, ctx) {
    return "Я студент педиатрического факультета, готовлюсь к экзамену по анатомии. Отвечай по-русски, латинские термины давай в скобках, "
      + "отмечай возрастные особенности, если они есть.\n\n"
      + (ctx.length ? "Выдержки из моего конспекта:\n\n" + contextText(ctx) + "\n\n" : "")
      + "Вопрос: " + question;
  }
  // короткий вариант для ссылки на claude.ai (длина адреса ограничена)
  function linkPrompt(question, ctx) {
    const names = ctx.slice(0, 4).map((e) => `${e.item.n} (${e.item.l})`).join("; ");
    const q = question.length > 900 ? question.slice(0, 900) + "…" : question;
    return "Я студент педиатрического факультета, готовлюсь к экзамену по анатомии. Ответь по-русски, латинские термины давай в скобках, "
      + "отметь возрастные особенности, если они есть.\n\n" + q + (names ? "\n\nТемы из моего конспекта: " + names + "." : "");
  }

  /* ---------- простой безопасный Markdown ---------- */
  function inline(s) {
    return A.esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:!?]|$)/g, "$1<i>$2</i>")
      .replace(/(^|[\s(])_([^_\s][^_]*)_(?=[\s).,;:!?]|$)/g, "$1<i>$2</i>");
  }
  function md(text) {
    const out = [];
    let list = null, para = [];
    const flushPara = () => { if (para.length) { out.push("<p>" + para.map(inline).join("<br>") + "</p>"); para = []; } };
    const flushList = () => { if (list) { out.push(`<${list.tag}>` + list.items.map((x) => "<li>" + inline(x) + "</li>").join("") + `</${list.tag}>`); list = null; } };
    String(text).split("\n").forEach((raw) => {
      const line = raw.replace(/\s+$/, "");
      let m;
      if (!line.trim()) { flushPara(); flushList(); return; }
      if ((m = line.match(/^#{1,6}\s+(.*)$/))) { flushPara(); flushList(); out.push("<h4>" + inline(m[1]) + "</h4>"); return; }
      if ((m = line.match(/^\s*(?:[-*•—]|(\d+)[.)])\s+(.*)$/))) {
        flushPara();
        const tag = m[1] ? "ol" : "ul";
        if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
        list.items.push(m[2]);
        return;
      }
      if (list && /^\s{2,}\S/.test(raw)) { list.items[list.items.length - 1] += " " + line.trim(); return; }
      flushList();
      para.push(line);
    });
    flushPara(); flushList();
    return out.join("");
  }

  /* ---------- запрос к Claude ---------- */
  function loadSdk() {
    if (window.AnthropicSDK) return Promise.resolve(window.AnthropicSDK);
    if (!sdkPromise) {
      sdkPromise = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = SDK_SRC;
        s.onload = () => (window.AnthropicSDK ? resolve(window.AnthropicSDK) : reject(new Error("sdk")));
        s.onerror = () => { sdkPromise = null; reject(new Error("sdk")); };
        document.head.appendChild(s);
      });
    }
    return sdkPromise;
  }

  function apiMessages() {
    // история без служебных записей; выдержки из конспекта прикладываются только к последнему вопросу
    const turns = chat.filter((m) => (m.role === "user") || (m.role === "assistant" && m.state === "done" && m.text));
    const recent = turns.slice(-HISTORY_TURNS);
    while (recent.length && recent[0].role !== "user") recent.shift();
    return recent.map((m, i) => {
      const lastUser = m.role === "user" && i === recent.length - 1;
      const text = lastUser && m.ctx && m.ctx.length ? "<конспект>\n" + contextText(m.ctx) + "\n</конспект>\n\n" + m.text : m.text;
      return { role: m.role, content: text };
    });
  }

  function errorText(Anthropic, err) {
    if (err instanceof Anthropic.AuthenticationError) return "Ключ API не подошёл. Проверьте его в настройках ниже.";
    if (err instanceof Anthropic.PermissionDeniedError) return "У этого ключа нет доступа к выбранной модели. Попробуйте другую модель в настройках.";
    if (err instanceof Anthropic.RateLimitError) return "Слишком много запросов или исчерпан лимит ключа. Подождите минуту и попробуйте снова.";
    if (err instanceof Anthropic.BadRequestError) return "Сервер не принял запрос: " + err.message;
    if (err instanceof Anthropic.APIConnectionError) return "Нет связи с api.anthropic.com. Проверьте интернет и попробуйте ещё раз.";
    if (err instanceof Anthropic.APIError) return "Ошибка сервера (" + (err.status || "?") + "). Попробуйте позже.";
    return "Не получилось получить ответ. Попробуйте ещё раз.";
  }

  async function askClaude(answer) {
    let Anthropic;
    try { Anthropic = await loadSdk(); } catch (e) {
      answer.state = "error"; answer.note = "Не удалось загрузить библиотеку для связи с Claude. Обновите страницу."; return;
    }
    const model = modelOf();
    const client = new Anthropic({ apiKey: get(KEY_STORE), dangerouslyAllowBrowser: true });
    const params = { model: model.id, max_tokens: MAX_TOKENS, system: SYSTEM, messages: apiMessages(), output_config: { effort: "medium" } };

    const once = async (withFallbacks) => {
      const stream = withFallbacks
        ? client.beta.messages.stream(Object.assign({ betas: [FALLBACK_BETA], fallbacks: "default" }, params))
        : client.messages.stream(params);
      active = stream;
      let scheduled = false;
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          answer.text += event.delta.text;
          if (!scheduled) { scheduled = true; requestAnimationFrame(() => { scheduled = false; paintAnswer(answer); }); }
        }
      }
      return stream.finalMessage();
    };

    try {
      let final;
      try {
        final = await once(model.fallbacks);
      } catch (err) {
        // если сервер не принял запрос с резервной моделью, повторяем один раз обычным запросом
        if (model.fallbacks && err instanceof Anthropic.BadRequestError && !answer.text) final = await once(false);
        else throw err;
      }
      answer.state = "done";
      if (final.stop_reason === "refusal") {
        answer.note = "Claude отказался отвечать на этот вопрос. Попробуйте сформулировать его иначе.";
        if (!answer.text) answer.state = "error";
      } else if (final.stop_reason === "max_tokens") {
        answer.note = "Ответ получился длинным и оборван. Напишите «продолжи», чтобы получить остальное.";
      }
    } catch (err) {
      if (err instanceof Anthropic.APIUserAbortError) {
        answer.state = answer.text ? "done" : "error";
        answer.note = "Остановлено.";
      } else {
        answer.state = answer.text ? "done" : "error";
        answer.note = errorText(Anthropic, err);
      }
    } finally {
      active = null;
    }
  }

  /* ---------- интерфейс ---------- */
  function ctxHtml(ctx) {
    if (!ctx || !ctx.length) return "";
    return `<div class="ai-ctx"><span>Из конспекта:</span>${ctx.map((e) => `
      <details data-sec="${e.sec.id}">
        <summary>${A.esc(e.item.n)} <span class="lat" lang="la">${A.esc(e.item.l)}</span></summary>
        <div class="ai-ctx-body">${A.itemBody(e.item)}
          <p class="mod-src"><a href="#/${e.sec.id}/${e.topic.id}/${e.idx}">Открыть в конспекте: ${A.esc(e.sec.title)} → ${A.esc(e.topic.title)}</a></p>
        </div>
      </details>`).join("")}</div>`;
  }

  function msgHtml(m, i) {
    if (m.role === "user") return `<div class="ai-msg user"><div class="ai-bubble">${A.esc(m.text).replace(/\n/g, "<br>")}</div></div>`;
    if (m.state === "manual") {
      const q = chat[i - 1];
      return `<div class="ai-msg bot">
        ${ctxHtml(q.ctx) || `<p class="note">В конспекте по этому вопросу ничего не нашлось.</p>`}
        <div class="ai-manual">
          <a class="btn primary" target="_blank" rel="noopener" href="https://claude.ai/new?q=${encodeURIComponent(linkPrompt(q.text, q.ctx || []))}">Спросить Claude в новой вкладке</a>
          <button class="btn" data-copy="${i - 1}">Скопировать запрос для любого ИИ</button>
        </div>
        <p class="note">Вопрос откроется на claude.ai — нужен бесплатный аккаунт Claude. Чтобы ответы приходили прямо сюда, добавьте ключ API в настройках ниже.</p>
      </div>`;
    }
    const q = chat[i - 1];
    return `<div class="ai-msg bot">
      ${ctxHtml(q && q.ctx)}
      <div class="ai-bubble" id="ai-ans-${i}">${m.text ? md(m.text) : m.state === "stream" ? `<span class="ai-wait">Думаю…</span>` : ""}</div>
      ${m.note ? `<p class="ai-note ${m.state === "error" ? "bad" : ""}">${A.esc(m.note)}</p>` : ""}
    </div>`;
  }

  function paintAnswer(m) {
    const el = document.getElementById("ai-ans-" + chat.indexOf(m));
    if (!el) return;
    const stick = window.innerHeight + window.scrollY >= document.body.scrollHeight - 140;
    el.innerHTML = md(m.text);
    if (stick) window.scrollTo(0, document.body.scrollHeight);
  }

  function settingsHtml() {
    const key = get(KEY_STORE), cur = modelOf();
    return `
      <details class="ai-settings" ${window.__aiSettingsOpen ? "open" : ""}>
        <summary>Настройки: ответы прямо на сайте (ключ API) ${key ? `<span class="tag">ключ сохранён</span>` : ""}</summary>
        <p>Без ключа помощник находит нужное в конспекте и открывает ваш вопрос в Claude в соседней вкладке — это бесплатно.</p>
        <p>С ключом API Claude отвечает прямо здесь. Ключ создаётся в консоли Anthropic (platform.claude.com → API keys). Это платная услуга: Anthropic списывает деньги за каждый вопрос и ответ с баланса вашего аккаунта.</p>
        <p>Ключ хранится только в этом браузере и отправляется только на api.anthropic.com. Не вводите его на чужом устройстве.</p>
        <label>Ключ API
          <input id="ai-key" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" value="${A.esc(key)}">
        </label>
        <label>Модель
          <select id="ai-model">${MODELS.map((m) => `<option value="${m.id}" ${m.id === cur.id ? "selected" : ""}>${m.name} — ${m.hint}</option>`).join("")}</select>
        </label>
        <div class="actions left">
          <button class="btn primary" id="ai-save">Сохранить</button>
          ${key ? `<button class="btn" id="ai-forget">Удалить ключ</button>` : ""}
        </div>
      </details>`;
  }

  function render() {
    A = window.APP;
    A.el.removeAttribute("data-sec");
    let draft = "";
    try { draft = sessionStorage.getItem(DRAFT_STORE) || ""; sessionStorage.removeItem(DRAFT_STORE); } catch (e) { /* нет черновика */ }
    const prev = document.getElementById("ai-input");
    if (!draft && prev) draft = prev.value;
    const hasKey = !!get(KEY_STORE);

    A.el.innerHTML = `
      <div class="stage ai">
        <h1>ИИ-помощник</h1>
        <p class="lead">Задайте вопрос по анатомии. Помощник найдёт нужные пункты в конспекте${hasKey ? ", а Claude ответит прямо здесь." : " и откроет вопрос в Claude."}</p>
        ${chat.length ? "" : `<div class="ai-examples">${EXAMPLES.map((x) => `<button class="btn" data-ex="${A.esc(x)}">${A.esc(x)}</button>`).join("")}</div>`}
        <div class="ai-log">${chat.map(msgHtml).join("")}</div>
        <form class="ai-form" id="ai-form">
          <textarea id="ai-input" rows="3" placeholder="Например: чем иннервируется дельтовидная мышца и что будет при повреждении нерва?">${A.esc(draft)}</textarea>
          <div class="actions left">
            ${busy ? `<button type="button" class="btn" id="ai-stop">Остановить</button>` : `<button type="submit" class="btn primary">Спросить</button>`}
            ${chat.length && !busy ? `<button type="button" class="btn ghost" id="ai-clear">Новый диалог</button>` : ""}
          </div>
        </form>
        ${settingsHtml()}
        <p class="note">ИИ может ошибаться. Важные факты сверяйте с учебником и лекциями кафедры.</p>
      </div>`;
    bind();
  }

  async function send(text) {
    const question = text.trim();
    if (!question || busy) return;
    const ctx = retrieve(question, 5);
    chat.push({ role: "user", text: question, ctx });
    const input = document.getElementById("ai-input");
    if (input) input.value = "";

    if (!get(KEY_STORE)) {
      chat.push({ role: "assistant", text: "", state: "manual" });
      render();
      window.scrollTo(0, document.body.scrollHeight);
      return;
    }
    const answer = { role: "assistant", text: "", state: "stream" };
    chat.push(answer);
    busy = true;
    render();
    window.scrollTo(0, document.body.scrollHeight);
    await askClaude(answer);
    busy = false;
    if (/^#\/ai/.test(location.hash)) render();
  }

  function bind() {
    const form = document.getElementById("ai-form");
    const input = document.getElementById("ai-input");
    form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(input.value); } });
    A.el.querySelectorAll("[data-ex]").forEach((b) => b.addEventListener("click", () => send(b.dataset.ex)));
    A.el.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => {
      const q = chat[+b.dataset.copy];
      const text = fullPrompt(q.text, q.ctx || []);
      const done = () => { b.textContent = "Скопировано"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => window.prompt("Скопируйте запрос:", text));
      else window.prompt("Скопируйте запрос:", text);
    }));
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
    on("ai-stop", () => { if (active) active.abort(); });
    on("ai-clear", () => { chat = []; render(); });
    on("ai-save", () => {
      set(KEY_STORE, document.getElementById("ai-key").value.trim());
      set(MODEL_STORE, document.getElementById("ai-model").value);
      window.__aiSettingsOpen = false;
      render();
    });
    on("ai-forget", () => { set(KEY_STORE, ""); window.__aiSettingsOpen = true; render(); });
    const settings = A.el.querySelector(".ai-settings");
    if (settings) settings.addEventListener("toggle", () => { window.__aiSettingsOpen = settings.open; });
  }

  PAGES.ai = render;
  // для автотестов и отладки
  window.APP_AI = { retrieve, md, fullPrompt, linkPrompt, apiMessages: () => apiMessages() };
})();
