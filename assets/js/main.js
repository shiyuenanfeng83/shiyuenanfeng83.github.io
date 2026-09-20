/* ===== 主题：深色 / 浅色 ===== */
const themeToggle = document.getElementById("themeToggle");
const THEME_KEY = "ai-portfolio-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.querySelector(".theme-toggle__icon").textContent = theme === "dark" ? "☀️" : "🌙";
}

const savedTheme = localStorage.getItem(THEME_KEY);
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
});

/* ===== 顶部统计 ===== */
function daysSince(dateStr) {
  const start = new Date(dateStr + "-01");
  const diff = Date.now() - start.getTime();
  return Math.max(1, Math.floor(diff / 86400000));
}

const statsEl = document.getElementById("stats");
const statValues = { projects: PROJECTS.length, days: daysSince(SITE.startDate) };
statsEl.innerHTML = STATS.map((s) => {
  const value = s.key ? statValues[s.key] : s.value;
  return `<li><b class="grad">${value}</b><span>${s.label}</span></li>`;
}).join("");

/* ===== 成果卡片 ===== */
const grid = document.getElementById("worksGrid");
const emptyEl = document.getElementById("emptyWorks");

function cardHTML(p, index) {
  const total = PROJECTS.length - index; // 倒序编号：第 N 个成果
  const liveBtn = p.live
    ? `<a class="link-btn" href="${p.live}" target="_blank" rel="noopener">🚀 在线体验</a>`
    : `<span class="link-btn is-disabled">🚀 待上线</span>`;
  const repoBtn = p.repo
    ? `<a class="link-btn link-btn--ghost" href="${p.repo}" target="_blank" rel="noopener">📄 查看源码</a>`
    : "";
  return `
    <article class="card reveal">
      <div class="card__cover" style="--c1:${p.c1};--c2:${p.c2}">
        <span class="card__index">成果 #${total}</span>
        <span class="card__status">${p.status}</span>
        <span>${p.icon}</span>
      </div>
      <div class="card__body">
        <h3 class="card__title">${p.title}</h3>
        <p class="card__desc">${p.desc}</p>
        <div class="card__tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        <p class="card__meta">完成于 ${p.date}</p>
        <div class="card__links">${liveBtn}${repoBtn}</div>
      </div>
    </article>`;
}

function renderWorks(filter = "全部") {
  const list = filter === "全部" ? PROJECTS : PROJECTS.filter((p) => p.tags.includes(filter));
  grid.innerHTML = list.map((p, i) => cardHTML(p, PROJECTS.indexOf(p))).join("");
  emptyEl.hidden = list.length > 0;
  observeReveal();
}

/* ===== 分类筛选 ===== */
const filtersEl = document.getElementById("filters");
const allTags = ["全部", ...new Set(PROJECTS.flatMap((p) => p.tags))];
filtersEl.innerHTML = allTags
  .map((t, i) => `<button class="chip${i === 0 ? " is-active" : ""}" type="button">${t}</button>`)
  .join("");

filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  filtersEl.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
  btn.classList.add("is-active");
  renderWorks(btn.textContent.trim());
});

renderWorks();

/* ===== 学习轨迹 ===== */
document.getElementById("timelineList").innerHTML = TIMELINE.map(
  (t) => `<li class="reveal">
    <time>${t.date}</time>
    <h3>${t.title}</h3>
    <p>${t.desc}</p>
  </li>`
).join("");

/* ===== 技能 & 计划 ===== */
document.getElementById("skillTags").innerHTML = SKILLS.map((s) => `<span class="tag">${s}</span>`).join("");
document.getElementById("planList").innerHTML = PLAN.map(
  (p) => `<li><span>${p.done ? "✅" : "⬜"}</span><span>${p.text}</span></li>`
).join("");

/* ===== 滚动入场动画 ===== */
function observeReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => io.observe(el));
}
observeReveal();

document.getElementById("year").textContent = new Date().getFullYear();
