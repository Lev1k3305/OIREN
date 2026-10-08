// ---------- App State ----------
let lessons = [];
let activityLog = [];
let currentUser = null;
let currentProfile = null;
let activeToolFilter = "Все";
let searchQuery = "";
let previousView = "landing";
let activeLessonTitle = null;
let authMode = "signin";

// ---------- Theme Management ----------
function initTheme() {
  const savedTheme = localStorage.getItem("neuroguide_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeToggleUI(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("neuroguide_theme", newTheme);
  updateThemeToggleUI(newTheme);
  showToast(`Тема изменена на ${newTheme === "dark" ? "тёмную" : "светлую"}`);
}

function updateThemeToggleUI(theme) {
  const icon = document.getElementById("themeToggleIcon");
  const label = document.getElementById("themeToggleLabel");
  if (icon && label) {
    icon.textContent = theme === "dark" ? "🌙" : "☀️";
    label.textContent = theme === "dark" ? "Тёмная тема" : "Светлая тема";
  }
}

// ---------- Toast Notification ----------
let toastEl = null;
function showToast(text) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.innerHTML = `<span class="toast-dot"></span><span id="toastText"></span>`;
    document.body.appendChild(toastEl);
  }
  document.getElementById("toastText").textContent = text;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2600);
}

// ---------- Activity & Chart Computations ----------
function logActivity(minutes) {
  activityLog.push({ date: new Date(), minutes });
}

function computeChartData(range) {
  const nowD = new Date();
  if (range === "day") {
    const buckets = [0, 0, 0, 0, 0];
    const labels = ["6-10", "10-14", "14-18", "18-22", "22-2"];
    activityLog.forEach(e => {
      if (new Date(e.date).toDateString() !== nowD.toDateString()) return;
      const h = new Date(e.date).getHours();
      let idx = h >= 6 && h < 10 ? 0 : h >= 10 && h < 14 ? 1 : h >= 14 && h < 18 ? 2 : h >= 18 && h < 22 ? 3 : 4;
      buckets[idx] += e.minutes;
    });
    return { labels, values: buckets, caption: "Сегодня, по времени суток (мин)" };
  }
  if (range === "week") {
    const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const labels = [];
    const buckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowD);
      d.setDate(d.getDate() - i);
      labels.push(dayNames[d.getDay()]);
      const sum = activityLog
        .filter(e => new Date(e.date).toDateString() === d.toDateString())
        .reduce((s, e) => s + e.minutes, 0);
      buckets.push(sum);
    }
    return { labels, values: buckets, caption: "Эта неделя, по дням (мин)" };
  }
  if (range === "month") {
    const labels = ["Нед 1", "Нед 2", "Нед 3", "Нед 4"];
    const buckets = [0, 0, 0, 0];
    activityLog.forEach(e => {
      const diffDays = Math.floor((nowD - new Date(e.date)) / 86400000);
      if (diffDays >= 0 && diffDays < 28) {
        const idx = 3 - Math.floor(diffDays / 7);
        buckets[idx] += e.minutes;
      }
    });
    return { labels, values: buckets, caption: "Этот месяц, по неделям (мин)" };
  }
  // year
  const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const labels = [];
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
    labels.push(monthNames[d.getMonth()]);
    const sum = activityLog
      .filter(e => {
        const ed = new Date(e.date);
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
      })
      .reduce((s, e) => s + e.minutes, 0);
    buckets.push(sum);
  }
  return { labels, values: buckets, caption: "Этот год, по месяцам (мин)" };
}

// ---------- Count Animation ----------
function animateCount(el, target, suffix = "") {
  if (!el) return;
  const duration = 600;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased * 10) / 10;
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(tick);
}

// ---------- Chart Rendering ----------
function renderChart(range) {
  const data = computeChartData(range);
  const svg = document.getElementById("chartSvg");
  if (!svg) return;

  const w = 640, h = 200, padX = 24, padTop = 18, padBottom = 32;
  const max = Math.max(...data.values, 10);
  const n = data.values.length;
  const gap = (w - padX * 2) / (n - 1 || 1);

  const points = data.values.map((v, i) => {
    const x = padX + i * gap;
    const y = padTop + (1 - v / max) * (h - padTop - padBottom);
    return { x, y, v };
  });

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    path += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const areaPath = path + ` L ${points[n - 1].x} ${h - padBottom} L ${points[0].x} ${h - padBottom} Z`;

  let gridLines = "";
  for (let g = 0; g <= 3; g++) {
    const gy = padTop + (g / 3) * (h - padTop - padBottom);
    gridLines += `<line x1="${padX}" y1="${gy}" x2="${w - padX}" y2="${gy}" stroke="var(--border)" stroke-width="1" stroke-dasharray="4"/>`;
  }

  let dots = "";
  let labels = "";
  points.forEach((p, i) => {
    const isLast = i === n - 1;
    dots += `<circle class="chart-point" cx="${p.x}" cy="${p.y}" r="4.5" fill="${isLast ? 'var(--amber)' : 'var(--mint)'}" stroke="var(--bg)" stroke-width="2"><title>${data.labels[i]}: ${p.v} мин</title></circle>`;
    labels += `<text x="${p.x}" y="${h - 10}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="IBM Plex Mono">${data.labels[i]}</text>`;
  });

  svg.innerHTML = `
    <defs>
      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--mint)" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="var(--mint)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${gridLines}
    <path d="${areaPath}" fill="url(#areaFill)"/>
    <path d="${path}" fill="none" stroke="var(--mint)" stroke-width="2.5"/>
    ${dots}
    ${labels}
  `;
  const captionEl = document.getElementById("chartCaption");
  if (captionEl) captionEl.textContent = data.caption;
}

// ---------- Icons & Tool Glow Colors ----------
const toolIcons = {
  "Claude": "🟠", "Cursor": "🧭", "ChatGPT": "💬", "v0": "🎛️",
  "Replit": "🧪", "Lovable": "💗", "Google AI Studio": "✨", "Antigravity": "🛰️",
  "Codex": "🖇️", "Windsurf": "🌊", "Bolt.new": "⚡", "GitHub Copilot": "🐙"
};

const toolColors = {
  "Claude": "#FFB454", "Cursor": "#7DB8FF", "ChatGPT": "#6EE7B7", "v0": "#B4A7FF",
  "Replit": "#7DFFC4", "Lovable": "#FF8FB1", "Google AI Studio": "#7DD3FF", "Antigravity": "#9C9CFF",
  "Codex": "#FFD37D", "Windsurf": "#5FE0E0", "Bolt.new": "#FFE066", "GitHub Copilot": "#C9C9C9"
};

function toolGlowStyle(tool) {
  const c = toolColors[tool] || "#9CA3AF";
  return `border-color:${c}55; box-shadow: 0 0 0 1px ${c}22, 0 4px 14px ${c}1f;`;
}

// ---------- Dashboard Stats & Recent Lessons ----------
function renderStats() {
  const done = lessons.filter(l => l.status === 'done').length;
  const total = lessons.length || 1;
  const pct = Math.round((done / total) * 100);

  animateCount(document.getElementById("statLessons"), done);
  animateCount(document.getElementById("statPercent"), pct, "%");

  const totalMinutes = activityLog.reduce((s, e) => s + e.minutes, 0);
  const hours = Math.round((totalMinutes / 60) * 10) / 10;
  const hoursEl = document.getElementById("statHours");
  if (hoursEl) hoursEl.textContent = hours;

  renderProgressRing(pct);
}

function renderProgressRing(pct) {
  const ring = document.getElementById("progressRingFill");
  if (!ring) return;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct / 100);
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = offset;
  const label = document.getElementById("progressRingLabel");
  if (label) label.textContent = pct + "%";
}

function renderRecent() {
  const container = document.getElementById("recentLessons");
  if (!container) return;
  const recent = lessons.slice(-5).reverse();
  if (recent.length === 0) {
    container.innerHTML = `<div class="empty-state">Уроков пока нет.</div>`;
    return;
  }
  container.innerHTML = recent.map(l => `
    <div class="lesson-row">
      <div class="check ${l.status !== 'done' ? 'pending' : ''}">${l.status === 'done' ? '✓' : (l.status === 'progress' ? '…' : '')}</div>
      <div>
        <div class="lesson-title">${l.title}</div>
        <div class="lesson-meta">${l.module}</div>
      </div>
      <div class="tool-tag">${l.tool}</div>
      <div class="lesson-date mono">${l.date}</div>
    </div>
  `).join("");
}

function renderContinueCard() {
  const next = lessons.find(l => l.status !== 'done');
  const card = document.getElementById("continueCard");
  if (!card) return;

  if (!next) {
    document.getElementById("continueTitle").textContent = "Все материалы изучены 🎉";
    document.getElementById("continueIcon").textContent = "🏁";
    card.onclick = null;
    card.style.cursor = "default";
    return;
  }

  document.getElementById("continueTitle").textContent = next.title;
  const iconEl = document.getElementById("continueIcon");
  iconEl.textContent = toolIcons[next.tool] || "🧭";
  iconEl.style.cssText = toolGlowStyle(next.tool);
  card.onclick = () => openLessonPage(next.title);
  card.style.cursor = "pointer";
}

// ---------- Curriculum & Search Filter ----------
function renderToolChips() {
  const tools = ["Все", ...new Set(lessons.map(l => l.tool))];
  const container = document.getElementById("toolChips");
  if (!container) return;
  container.innerHTML = tools.map(t => `
    <button class="chip ${t === activeToolFilter ? 'active' : ''}" onclick="setToolFilter('${t.replace(/'/g, "\\'")}')">${t}</button>
  `).join("");
}

function setToolFilter(tool) {
  activeToolFilter = tool;
  renderToolChips();
  renderCurriculum();
}

function renderCurriculum() {
  const filtered = lessons.filter(l => {
    const matchesTool = activeToolFilter === "Все" || l.tool === activeToolFilter;
    const matchesSearch = !searchQuery || l.title.toLowerCase().includes(searchQuery) || l.tool.toLowerCase().includes(searchQuery);
    return matchesTool && matchesSearch;
  });

  const modules = [...new Set(filtered.map(l => l.module))];
  const container = document.getElementById("curriculumContainer");
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">Ничего не найдено. Попробуй другой запрос или сбрось фильтр.</div>`;
    return;
  }

  container.innerHTML = modules.map(mod => {
    const modLessons = filtered.filter(l => l.module === mod);
    const allInModule = lessons.filter(l => l.module === mod);
    const doneCount = allInModule.filter(l => l.status === 'done').length;
    const pct = Math.round((doneCount / allInModule.length) * 100);

    return `
      <div class="module-block">
        <div class="module-head">
          <div class="module-name">${mod}</div>
          <div class="module-progress-bar"><div class="module-progress-fill" style="width:${pct}%"></div></div>
          <div class="module-count">${doneCount} / ${allInModule.length}</div>
        </div>
        <div class="lesson-path">
          ${modLessons.map((l, idx) => `
            <div class="path-item ${l.status === 'done' ? 'done' : (l.status === 'progress' ? 'progress' : '')}" style="animation:card-in .4s cubic-bezier(.2,.8,.2,1) ${idx * 0.05}s backwards;" onclick="openLessonPage('${l.title.replace(/'/g, "\\'")}')">
              <div class="path-icon" style="${toolGlowStyle(l.tool)}">${toolIcons[l.tool] || "🧠"}</div>
              <div class="path-content">
                <div class="path-title">${l.title}</div>
                ${l.desc ? `<div class="path-desc">${l.desc}</div>` : ""}
                <div class="path-tool mono">${l.tool}</div>
              </div>
              <div class="path-status">${l.status === 'done' ? '✓' : '›'}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

// ---------- Lesson Detail View & Interactive Checklist ----------
function openLessonPage(title) {
  const lesson = lessons.find(l => l.title === title);
  if (!lesson) return;

  const activeNav = document.querySelector(".nav-item.active[data-view]");
  if (activeNav) previousView = activeNav.dataset.view;

  document.getElementById("lessonDetailTitle").textContent = lesson.title;
  document.getElementById("lessonDetailMeta").textContent = `${lesson.module} · ${lesson.tool}`;
  const iconEl = document.getElementById("lessonDetailIcon");
  iconEl.textContent = toolIcons[lesson.tool] || "🧠";
  iconEl.style.cssText = toolGlowStyle(lesson.tool);

  const info = lesson.content || {};
  document.getElementById("detailWhat").textContent = info.what || lesson.desc || "Содержание появится скоро.";
  document.getElementById("detailUseFor").textContent = info.useFor || "—";
  document.getElementById("detailStart").textContent = info.start || "—";

  // Build Interactive Checklist for Practical Task
  renderChecklist(info.task || "1. Ознакомься с материалом\n2. Выполни практические шаги");

  const pill = document.getElementById("detailStatusPill");
  const doneBtn = document.getElementById("detailMarkDoneBtn");
  if (lesson.status === "done") {
    pill.textContent = "Изучено ✓";
    pill.classList.add("done");
    doneBtn.textContent = "Изучено";
    doneBtn.style.opacity = "0.5";
    doneBtn.style.pointerEvents = "none";
  } else {
    pill.textContent = "Не начато";
    pill.classList.remove("done");
    doneBtn.textContent = "Отметить как изучено";
    doneBtn.style.opacity = "1";
    doneBtn.style.pointerEvents = "auto";
  }

  // Sidebar module items
  const others = lessons.filter(l => l.module === lesson.module && l.title !== lesson.title);
  document.getElementById("detailModuleList").innerHTML = others.map(o => `
    <div class="side-lesson-item" onclick="openLessonPage('${o.title.replace(/'/g, "\\'")}')">
      <span>${o.status === 'done' ? '✓' : '·'}</span>
      <span>${o.title}</span>
    </div>
  `).join("") || `<div class="lesson-meta" style="font-size:12.5px;">Это единственный материал в модуле</div>`;

  // Next / Prev buttons
  const allIdx = lessons.findIndex(l => l.title === lesson.title);
  const prevLesson = lessons[allIdx - 1];
  const nextLesson = lessons[allIdx + 1];
  const prevBtn = document.getElementById("prevLessonBtn");
  const nextBtn = document.getElementById("nextLessonBtn");
  prevBtn.disabled = !prevLesson;
  nextBtn.disabled = !nextLesson;
  prevBtn.onclick = () => prevLesson && openLessonPage(prevLesson.title);
  nextBtn.onclick = () => nextLesson && openLessonPage(nextLesson.title);

  activeLessonTitle = title;

  document.querySelectorAll(".nav-item[data-view]").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-lesson").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderChecklist(taskText) {
  const container = document.getElementById("detailTask");
  if (!container) return;

  const lines = taskText.split("\n").filter(l => l.trim().length > 0);
  container.innerHTML = `
    <div class="checklist-container">
      ${lines.map((line, idx) => {
        const cleanLine = line.replace(/^[0-9]+\.\s*/, "");
        return `
          <label class="checklist-item" id="checkItem-${idx}">
            <input type="checkbox" onchange="toggleChecklistItem(${idx}, this.checked)">
            <span>${cleanLine}</span>
          </label>
        `;
      }).join("")}
    </div>
  `;
}

function toggleChecklistItem(idx, isChecked) {
  const item = document.getElementById(`checkItem-${idx}`);
  if (item) {
    item.classList.toggle("completed", isChecked);
  }
}

// ---------- Mark Lesson Done Handler ----------
async function markCurrentLessonDone() {
  const lesson = lessons.find(l => l.title === activeLessonTitle);
  if (!lesson) return;
  const minutes = 20 + Math.round(Math.random() * 20);

  if (sb && currentUser) {
    try {
      await sb.from("lesson_progress").upsert({
        user_id: currentUser.id,
        lesson_id: lesson.id,
        status: "done",
        completed_at: new Date().toISOString()
      });
      await sb.from("activity_log").insert({
        user_id: currentUser.id,
        lesson_id: lesson.id,
        minutes
      });
    } catch (e) {
      console.warn("Supabase save error, saved locally:", e);
    }
  }

  lesson.status = "done";
  lesson.date = "сегодня";
  logActivity(minutes);

  renderCurriculum();
  renderRecent();
  renderStats();
  renderContinueCard();

  const activeTab = document.querySelector(".range-tab.active");
  renderChart(activeTab ? activeTab.dataset.range : "day");

  openLessonPage(lesson.title);
  showToast(`🎉 Гайд «${lesson.title}» освоен!`);
}

// ---------- Auth Handlers & Gate ----------
function toggleAuthMode() {
  authMode = authMode === "signin" ? "signup" : "signin";
  const isSignup = authMode === "signup";
  document.getElementById("nameFieldWrap").style.display = isSignup ? "block" : "none";
  document.getElementById("authTitle").textContent = isSignup ? "Создай аккаунт" : "С возвращением";
  document.getElementById("authSubtitle").textContent = isSignup ? "Начни путь в AI-разработке" : "Войди, чтобы продолжить обучение";
  document.getElementById("authSubmitBtn").textContent = isSignup ? "Зарегистрироваться" : "Войти";
  document.getElementById("authSwitchText").textContent = isSignup ? "Уже есть аккаунт?" : "Ещё нет аккаунта?";
  document.getElementById("authSwitchBtn").textContent = isSignup ? "Войти" : "Зарегистрироваться";
  document.getElementById("authError").classList.remove("show");
  document.getElementById("forgotPasswordLink").style.display = isSignup ? "none" : "block";
}

function showForgotPassword() {
  document.getElementById("authGate").classList.add("hidden");
  document.getElementById("forgotGate").classList.remove("hidden");
  document.getElementById("forgotEmail").value = document.getElementById("authEmail").value;
}

function hideForgotPassword() {
  document.getElementById("forgotGate").classList.add("hidden");
  document.getElementById("authGate").classList.remove("hidden");
}

async function handleForgotSubmit(event) {
  event.preventDefault();
  const email = document.getElementById("forgotEmail").value.trim();
  const errBox = document.getElementById("forgotError");
  const btn = document.getElementById("forgotSubmitBtn");
  errBox.classList.remove("show");
  btn.disabled = true;
  btn.textContent = "Отправляем...";

  try {
    if (sb) {
      const redirectTo = window.location.origin + window.location.pathname;
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
    }
    errBox.style.color = "var(--mint)";
    errBox.style.background = "var(--mint-light)";
    errBox.style.borderColor = "var(--mint)";
    errBox.textContent = "Ссылка отправлена на ваш Email.";
    errBox.classList.add("show");
  } catch (e) {
    errBox.style.color = ""; errBox.style.background = ""; errBox.style.borderColor = "";
    errBox.textContent = e.message || "Не удалось отправить письмо";
    errBox.classList.add("show");
  } finally {
    btn.disabled = false;
    btn.textContent = "Отправить ссылку";
  }
  return false;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const name = document.getElementById("authName").value.trim();
  const errBox = document.getElementById("authError");
  const submitBtn = document.getElementById("authSubmitBtn");
  errBox.classList.remove("show");
  submitBtn.disabled = true;
  submitBtn.textContent = "Подождите...";

  try {
    if (sb) {
      if (authMode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name: name || "Студент" } } });
        if (error) throw error;
        if (!data.session) {
          errBox.textContent = "Регистрация успешна! Проверь почту для подтверждения.";
          errBox.classList.add("show");
          return;
        }
        await enterApp(data.user);
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
          console.warn("Supabase auth error, entering demo mode:", error.message);
          await enterApp({ id: "demo-user-123", email });
        } else {
          await enterApp(data.user);
        }
      }
    } else {
      // Fallback Mode login
      await enterApp({ id: "demo-user-123", email });
    }
  } catch (e) {
    console.warn("Auth error, entering demo mode:", e);
    await enterApp({ id: "demo-user-123", email });
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = authMode === "signup" ? "Зарегистрироваться" : "Войти";
  }
  return false;
}

async function enterApp(user) {
  currentUser = { id: user.id, email: user.email };

  if (sb) {
    try {
      const [{ data: profile }, { data: lessonRows }, { data: progressRows }, { data: activityRows }] = await Promise.all([
        sb.from("profiles").select("*").eq("id", user.id).single(),
        sb.from("lessons").select("id, module_id, title, tool, short_desc, what_is_it, use_for, how_to_start, practical_task, sort_order, modules(name)").order("sort_order"),
        sb.from("lesson_progress").select("lesson_id, status, completed_at").eq("user_id", user.id),
        sb.from("activity_log").select("minutes, occurred_at").eq("user_id", user.id)
      ]);

      currentProfile = profile || FALLBACK_DATA.profile;
      const progressByLesson = {};
      (progressRows || []).forEach(p => progressByLesson[p.lesson_id] = p);

      if (lessonRows && lessonRows.length > 0) {
        lessons = lessonRows.map(l => {
          const prog = progressByLesson[l.id];
          return {
            id: l.id,
            title: l.title,
            module: l.modules?.name || "Модуль 1",
            tool: l.tool,
            desc: l.short_desc,
            status: prog?.status || "pending",
            date: prog?.completed_at ? new Date(prog.completed_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "—",
            content: { what: l.what_is_it, useFor: l.use_for, start: l.how_to_start, task: l.practical_task }
          };
        });
      } else {
        lessons = FALLBACK_DATA.lessons;
      }

      activityLog = (activityRows || []).map(a => ({ date: new Date(a.occurred_at), minutes: a.minutes }));
    } catch (e) {
      console.warn("Error fetching Supabase data, loading fallbacks:", e);
      currentProfile = FALLBACK_DATA.profile;
      lessons = FALLBACK_DATA.lessons;
      activityLog = FALLBACK_DATA.activityLog;
    }
  } else {
    currentProfile = FALLBACK_DATA.profile;
    lessons = FALLBACK_DATA.lessons;
    activityLog = FALLBACK_DATA.activityLog;
  }

  // Populate UI
  const displayName = currentProfile?.name || user.email.split("@")[0];
  const initials = currentProfile?.avatar_initials || displayName.slice(0, 2).toUpperCase();

  document.getElementById("profileAvatarInitials").textContent = initials;
  document.getElementById("profileNameText").textContent = displayName;
  document.getElementById("profileEmailText").textContent = user.email;
  document.getElementById("dashboardGreeting").textContent = `Привет, ${displayName} 👋`;
  document.getElementById("settingsAccountLine").textContent = `${displayName} · ${currentProfile?.track || "Веб-разработка с AI"}`;

  if (currentProfile) {
    document.querySelectorAll("[data-toggle]").forEach(t => {
      const field = t.dataset.field;
      if (field && field in currentProfile) {
        t.classList.toggle("on", !!currentProfile[field]);
      }
    });
  }

  // Streak Calculation
  const dayStrings = new Set(activityLog.map(a => new Date(a.date).toDateString()));
  let streak = 0;
  let cursor = new Date();
  if (!dayStrings.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dayStrings.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  document.getElementById("streakBadge").textContent = `🔥 ${streak} ${streak === 1 ? 'день' : 'дней'} подряд`;

  // Display App
  document.getElementById("authGate").classList.add("hidden");
  document.getElementById("mainApp").style.display = "grid";

  renderChart("day");
  renderRecent();
  renderToolChips();
  renderCurriculum();
  renderStats();
  renderContinueCard();

  if (currentProfile && currentProfile.has_seen_onboarding === false) {
    document.getElementById("welcomeTitle").textContent = `Добро пожаловать, ${displayName}!`;
    document.getElementById("welcomeGate").classList.remove("hidden");
  }
}

async function dismissWelcome() {
  document.getElementById("welcomeGate").classList.add("hidden");
  if (sb && currentUser) {
    await sb.from("profiles").update({ has_seen_onboarding: true }).eq("id", currentUser.id);
  }
  const currBtn = document.querySelector('.nav-item[data-view="curriculum"]');
  if (currBtn) currBtn.click();
}

async function logout() {
  if (sb) {
    await sb.auth.signOut();
  }
  currentUser = null;
  currentProfile = null;
  lessons = [];
  activityLog = [];
  document.getElementById("mainApp").style.display = "none";
  document.getElementById("authGate").classList.remove("hidden");
  document.getElementById("authEmail").value = "";
  document.getElementById("authPassword").value = "";
  showToast("Вы вышли из системы");
}

// ---------- DOM Event Listeners Initialization ----------
document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  // Navigation Items
  document.querySelectorAll(".nav-item[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item[data-view]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));

      const viewId = "view-" + btn.dataset.view;
      const targetView = document.getElementById(viewId);
      if (targetView) targetView.classList.add("active");

      if (btn.dataset.view === "dashboard") {
        renderStats();
        const activeTab = document.querySelector(".range-tab.active");
        renderChart(activeTab ? activeTab.dataset.range : "day");
      }
    });
  });

  // Range Tabs
  document.querySelectorAll(".range-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".range-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderChart(tab.dataset.range);
    });
  });

  // Search Input
  const searchInput = document.getElementById("lessonSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderCurriculum();
    });
  }

  // Back from Lesson Detail
  const backBtn = document.getElementById("lessonBackBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      document.getElementById("view-" + previousView).classList.add("active");
      const navBtn = document.querySelector(`.nav-item[data-view="${previousView}"]`);
      if (navBtn) navBtn.classList.add("active");
    });
  }

  // Mark Lesson Done Button
  const doneBtn = document.getElementById("detailMarkDoneBtn");
  if (doneBtn) {
    doneBtn.addEventListener("click", markCurrentLessonDone);
  }

  // View Curriculum CTA Button on Landing
  const viewCurrCta = document.getElementById("viewCurriculumBtn");
  if (viewCurrCta) {
    viewCurrCta.addEventListener("click", () => {
      const navBtn = document.querySelector('.nav-item[data-view="curriculum"]');
      if (navBtn) navBtn.click();
    });
  }

  // Settings Toggles
  document.querySelectorAll("[data-toggle]").forEach(t => {
    t.addEventListener("click", async () => {
      const wasOn = t.classList.contains("on");
      t.classList.toggle("on");
      const field = t.dataset.field;
      if (field && sb && currentUser) {
        await sb.from("profiles").update({ [field]: !wasOn }).eq("id", currentUser.id);
      }
    });
  });

  // Auth Form Submit Listener
  const authForm = document.getElementById("authForm");
  if (authForm) {
    authForm.addEventListener("submit", handleAuthSubmit);
  }

  const forgotForm = document.getElementById("forgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", handleForgotSubmit);
  }

  // Logout Button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // Auto Session Check or Fallback
  (async function initAuthCheck() {
    if (sb) {
      try {
        const { data } = await sb.auth.getSession();
        if (data?.session?.user) {
          await enterApp(data.session.user);
          return;
        }
      } catch (e) {
        console.warn("Session check error, fallback active:", e);
      }
    }
  })();
});
