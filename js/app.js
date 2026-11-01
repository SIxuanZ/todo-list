// ============================================================
// 我的待办清单 —— 全部逻辑都在这个文件里
// 数据结构：每条待办是一个对象 { id: 唯一编号, text: 内容, done: 是否完成 }
// 存储方式：浏览器的 localStorage（关掉网页数据还在，只存在你自己的电脑上）
// ============================================================

const STORAGE_KEY = "todo.tasks.v1";

// 页面上的元素，先抓出来备用
const inputEl = document.getElementById("input");
const composerEl = document.getElementById("composer");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const counterEl = document.getElementById("counter");
const filtersEl = document.getElementById("filters");
const clearDoneEl = document.getElementById("clearDone");
const todayEl = document.getElementById("today");

// 当前状态
let tasks = loadTasks(); // 待办数组
let filter = "all"; // all | active | done

// ---------- 读写本地存储 ----------

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // 存储内容被手动改坏时，不要让整个页面白屏
    console.warn("读取本地数据失败，已重置", err);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ---------- 增删改 ----------

function addTask(text) {
  const value = text.trim();
  if (!value) return;

  tasks.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text: value,
    done: false,
  });

  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  task.done = !task.done;
  saveTasks();
  render();
}

function removeTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

function clearDone() {
  tasks = tasks.filter((t) => !t.done);
  saveTasks();
  render();
}

// ---------- 渲染 ----------

function visibleTasks() {
  if (filter === "active") return tasks.filter((t) => !t.done);
  if (filter === "done") return tasks.filter((t) => t.done);
  return tasks;
}

function render() {
  const shown = visibleTasks();

  listEl.innerHTML = "";

  shown.forEach((task) => {
    const li = document.createElement("li");
    li.className = "item" + (task.done ? " is-done" : "");
    li.dataset.id = task.id;

    // 勾选圆圈
    const check = document.createElement("button");
    check.type = "button";
    check.className = "item__check";
    check.setAttribute("aria-label", task.done ? "标记为未完成" : "标记为已完成");
    check.addEventListener("click", () => toggleTask(task.id));

    // 文字（点文字也能勾选）
    const text = document.createElement("span");
    text.className = "item__text";
    text.textContent = task.text;
    text.addEventListener("click", () => toggleTask(task.id));

    // 删除
    const del = document.createElement("button");
    del.type = "button";
    del.className = "item__del";
    del.textContent = "×";
    del.setAttribute("aria-label", "删除这条待办");
    del.addEventListener("click", () => removeTask(task.id));

    li.append(check, text, del);
    listEl.appendChild(li);
  });

  // 空状态：当前筛选下没有内容时给一句提示
  const isEmpty = shown.length === 0;
  emptyEl.hidden = !isEmpty;
  emptyEl.textContent =
    tasks.length === 0
      ? "还没有待办，先写下第一件小事吧。"
      : filter === "done"
        ? "还没有已完成的待办。"
        : "没有未完成的待办，全部搞定了 🎉";

  // 计数
  const doneCount = tasks.filter((t) => t.done).length;
  counterEl.textContent = `共 ${tasks.length} 条 · 未完成 ${tasks.length - doneCount} 条`;
}

// ---------- 事件绑定 ----------

composerEl.addEventListener("submit", (event) => {
  event.preventDefault(); // 阻止表单默认的“刷新页面”行为
  addTask(inputEl.value);
  inputEl.value = "";
  inputEl.focus();
});

filtersEl.addEventListener("click", (event) => {
  const btn = event.target.closest(".filters__btn");
  if (!btn) return;

  filter = btn.dataset.filter;
  filtersEl.querySelectorAll(".filters__btn").forEach((el) => {
    el.classList.toggle("is-active", el === btn);
  });
  render();
});

clearDoneEl.addEventListener("click", () => {
  if (tasks.some((t) => t.done)) clearDone();
});

// ---------- 启动 ----------

todayEl.textContent = new Date().toLocaleDateString("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

render();
