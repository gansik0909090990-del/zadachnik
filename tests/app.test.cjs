const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function launch(storage = new Map()) {
  class Element {
    constructor() { this.children = []; this.listeners = {}; this.dataset = {}; this.value = ''; this.hidden = false; this.textContent = ''; this.classList = { toggle() {} }; }
    addEventListener(name, listener) { this.listeners[name] = listener; }
    setAttribute() {}
    append(...items) { this.children.push(...items); }
    replaceChildren() { this.children = []; }
    focus() {}
    fire(name) { this.listeners[name]({ preventDefault() {} }); }
  }
  const elements = Object.fromEntries(['task-form', 'task-input', 'task-list', 'empty', 'counter', 'error', 'clear-done', 'search-input'].map(id => [id, new Element()]));
  const filters = ['all', 'active', 'done'].map(filter => Object.assign(new Element(), { dataset: { filter } }));
  const context = vm.createContext({
    document: { getElementById: id => elements[id], querySelectorAll: () => filters, createElement: () => new Element() },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  for (const file of ['task-view.js', 'app.js']) {
    const full = path.join(__dirname, '..', file);
    if (fs.existsSync(full)) vm.runInContext(fs.readFileSync(full, 'utf8'), context, { filename: file });
  }
  return { elements, filters, storage,
    add(text) { elements['task-input'].value = text; elements['task-form'].fire('submit'); },
    titles() { return elements['task-list'].children.map(li => li.children[1].textContent); },
    search(text) { elements['search-input'].value = text; elements['search-input'].fire('input'); },
  };
}

test('Original add, toggle, filters, reload, delete, clear and validation', () => {
  const app = launch();
  app.add('  ');
  assert.equal(app.elements.error.textContent, 'Введите текст задачи.');
  assert.deepEqual(app.titles(), []);
  app.add('Купить молоко'); app.add('<b>Практикум</b>');
  assert.deepEqual(app.titles(), ['Купить молоко', '<b>Практикум</b>']);
  app.elements['task-list'].children[0].children[0].fire('change');
  app.filters[1].fire('click');
  assert.deepEqual(app.titles(), ['<b>Практикум</b>']);
  const reloaded = launch(app.storage);
  assert.deepEqual(reloaded.titles(), ['<b>Практикум</b>']);
  reloaded.filters[2].fire('click');
  assert.deepEqual(reloaded.titles(), ['Купить молоко']);
  reloaded.filters[0].fire('click');
  reloaded.elements['task-list'].children[1].children[2].fire('click');
  assert.deepEqual(reloaded.titles(), ['Купить молоко']);
  reloaded.elements['clear-done'].fire('click');
  assert.deepEqual(reloaded.titles(), []);
  assert.equal(reloaded.elements.empty.hidden, false);
});

test('Search supports Cyrillic, phrases, status filters and preserves stored data', () => {
  const app = launch();
  app.add('Купить молоко'); app.add('Купить хлеб'); app.add('Сдать практикум');
  app.elements['task-list'].children[0].children[0].fire('change');
  const before = app.storage.get('zadachnik.tasks.v1');
  app.search('  МОЛОКО  ');
  assert.deepEqual(app.titles(), ['Купить молоко']);
  app.filters[1].fire('click');
  assert.deepEqual(app.titles(), []);
  assert.equal(app.elements.empty.textContent, 'По вашему запросу задач не найдено.');
  app.filters[2].fire('click');
  assert.deepEqual(app.titles(), ['Купить молоко']);
  app.filters[0].fire('click');
  app.search('купить хлеб');
  assert.deepEqual(app.titles(), ['Купить хлеб']);
  app.search('отсутствует');
  assert.deepEqual(app.titles(), []);
  app.search('   ');
  assert.equal(app.titles().length, 3);
  assert.equal(app.storage.get('zadachnik.tasks.v1'), before);
  assert.equal(launch(app.storage).titles().length, 3);
  const empty = launch(); empty.search('молоко');
  assert.deepEqual(empty.titles(), []);
});
