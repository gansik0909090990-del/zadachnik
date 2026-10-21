"use strict";

const STORAGE_KEY = "zadachnik.tasks.v1";

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const listEl = document.getElementById("task-list");
const emptyEl = document.getElementById("empty");
const counterEl = document.getElementById("counter");
const errorEl = document.getElementById("error");
const clearBtn = document.getElementById("clear-done");

let tasks = load();

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    showError("Не удалось сохранить: хранилище браузера недоступно.");
  }
}

function showError(text) {
  errorEl.textContent = text;
  errorEl.hidden = !text;
}

function render() {
  listEl.replaceChildren();
  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = "item" + (task.done ? " done" : "");

    const box = document.createElement("input");
    box.type = "checkbox";
    box.id = "t-" + task.id;
    box.checked = task.done;
    box.addEventListener("change", () => toggle(task.id));

    const label = document.createElement("label");
    label.htmlFor = box.id;
    label.textContent = task.text; // textContent защищает от HTML-инъекций

    const del = document.createElement("button");
    del.type = "button";
    del.className = "del";
    del.textContent = "×";
    del.setAttribute("aria-label", "Удалить задачу: " + task.text);
    del.addEventListener("click", () => remove(task.id));

    li.append(box, label, del);
    listEl.append(li);
  }

  const left = tasks.filter(t => !t.done).length;
  counterEl.textContent = tasks.length ? `Осталось: ${left} из ${tasks.length}` : "";
  emptyEl.hidden = tasks.length > 0;
  clearBtn.hidden = !tasks.some(t => t.done);
}

function add(text) {
  tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, done: false });
  save(); render();
}
function toggle(id) {
  const t = tasks.find(x => x.id === id);
  if (t) { t.done = !t.done; save(); render(); }
}
function remove(id) {
  tasks = tasks.filter(x => x.id !== id);
  save(); render();
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) { showError("Введите текст задачи."); return; }
  showError("");
  add(text);
  input.value = "";
  input.focus();
});

clearBtn.addEventListener("click", () => {
  tasks = tasks.filter(t => !t.done);
  save(); render();
});

render();
