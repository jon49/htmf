var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));

// node_modules/html-es6cape/dist/index.esm.js
var t = { "&": "&amp;", ">": "&gt;", "<": "&lt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" };
var e = new RegExp(Object.keys(t).join("|"), "g");
function n(n2) {
  return void 0 === n2 && (n2 = ""), String(n2).replace(e, function(e3) {
    return t[e3];
  });
}

// node_modules/html-template-tag/dist/index.esm.js
function e2(e3) {
  for (var a = [], t2 = 1; t2 < arguments.length; t2++)
    a[t2 - 1] = arguments[t2];
  return e3.raw.reduce(function(t3, n2, i) {
    var o = a[i - 1];
    return Array.isArray(o) ? o = o.join("") : e3.raw[i - 1] && e3.raw[i - 1].endsWith("$") ? t3 = t3.slice(0, -1) : o = n(o), t3 + o + n2;
  });
}

// node_modules/idb-keyval/dist/index.js
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    request.onabort = request.onerror = () => reject(request.error);
  });
}
function createStore(dbName, storeName) {
  const request = indexedDB.open(dbName);
  request.onupgradeneeded = () => request.result.createObjectStore(storeName);
  const dbp = promisifyRequest(request);
  return (txMode, callback) => dbp.then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
}
var defaultGetStoreFunc;
function defaultGetStore() {
  if (!defaultGetStoreFunc) {
    defaultGetStoreFunc = createStore("keyval-store", "keyval");
  }
  return defaultGetStoreFunc;
}
function get(key, customStore = defaultGetStore()) {
  return customStore("readonly", (store) => promisifyRequest(store.get(key)));
}
function set(key, value, customStore = defaultGetStore()) {
  return customStore("readwrite", (store) => {
    store.put(value, key);
    return promisifyRequest(store.transaction);
  });
}
function getMany(keys, customStore = defaultGetStore()) {
  return customStore("readonly", (store) => Promise.all(keys.map((key) => promisifyRequest(store.get(key)))));
}
function del(key, customStore = defaultGetStore()) {
  return customStore("readwrite", (store) => {
    store.delete(key);
    return promisifyRequest(store.transaction);
  });
}

// src-todo/server/layout.ts
var _a;
function layout(todos) {
  return e2(_a || (_a = __template([`
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>HTMF \u2022 TodoMVC</title>
    <link rel="stylesheet" href="./css/base.css">
    <link rel="stylesheet" href="./css/index.css">
    <!-- CSS overrides - remove if you don't need it -->
    <link rel="stylesheet" href="./css/app.css">
</head>
<body>
    <section class="todoapp">
        <header class="header">
            <h1>todos</h1>
            <form
                target="#todo-list"
                method="post"
                action="/todos?handler=create"
                hf-swap="append"
                >
            <input
                id="new-todo"
                class="new-todo"
                placeholder="What needs to be done?"
                autofocus
                autocomplete="off"
                name="title"
                x-subscribe="todos-updated: this.value = ''; app.getTotalTodos() === 0 && this.focus()"
                >
            </form>
        </header>
        <!-- This section should be hidden by default and shown when there are todos -->
        <section
            id="todo-section"
            class="main"
            x-subscribe="todos-updated: $(this).classWhen('hidden', app.getTotalTodos() === 0)"
            >
            <form
                method="post"
                action="/todos?handler=toggle-all"
                target="#todo-list"
                onchange="this.requestSubmit()"
                >
                <input id="toggle-all" class="toggle-all" type="checkbox">
                <label for="toggle-all">Mark all as complete</label>
            </form>
            <ul id="todo-list" class="todo-list">$`, `</ul>
        </section>
        <!-- This footer should be hidden by default and shown when there are todos -->
        <footer
            id="footer"
            class="footer"
            x-subscribe="todos-updated: $(this).classWhen('hidden', app.getTotalTodos() === 0)"
            >
            <span
                class="todo-count"
                x-subscribe="todos-updated:
                        let count = app.getIncompleteTodos();
                        $(this).html('<strong>'+count+'</strong> item'+app.pluralize(count)+' left')"
                ></span>
            <ul class="filters">
                <li>
                    <a class="selected" href="#" data-action>All</a>
                </li>
                <li>
                    <a href="#/active">Active</a>
                </li>
                <li>
                    <a href="#/completed">Completed</a>
                </li>
            </ul>
            <!-- Hidden if no completed items are left \u2193 -->
            <form
                method="post"
                action="/todos?handler=clear-completed"
                target="#todo-list"
                >
                <button
                    id="clear-completed"
                    class="clear-completed"
                    x-subscribe="todos-updated: $(this).classWhen('hidden', app.getCompletedTodos() === 0)"
                    >Clear completed</button>
            </form>
        </footer>
    </section>
    <footer class="info">
        <p>Double-click to edit a todo</p>
        <p><a href="https://github.com/jon49/htmf/tree/master/src-todo">Source Code</a></p>
        <p>Created by <a href="https://jnyman.com">Jon Nyman</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
    </footer>
    <!-- Scripts here. Don't remove \u2193 -->
    <script src="./js/sw-loader.js"><\/script>
    <script src="./js/app.js"><\/script>
    <script src="./js/lib/htmf.js"><\/script>
</body>
</html>`])), todos);
}

// src-todo/server/actions.ts
var getAll = async () => {
  const todos = await get("todos") ?? [];
  if (todos.length === 0)
    return layout("");
  const todoData = await getMany(todos);
  const todoViews = todoData.map(todoView);
  return layout(todoViews.join(""));
};
var createTodo = async ({ data }) => {
  if (data.title === "")
    return null;
  const todos = await get("todos") ?? [];
  const newTodoId = Date.now();
  todos.push(newTodoId);
  await set("todos", todos);
  const newData = { ...data, completed: false, id: newTodoId };
  await set(newTodoId, newData);
  return todoView(newData);
};
var updateTodo = async ({ url, data }) => {
  const idMaybe = url.searchParams.get("id");
  if (!idMaybe)
    return null;
  const id = parseInt(idMaybe);
  const oldData = await get(id);
  const combinedData = { ...oldData, ...data };
  await set(id, combinedData);
  return todoView(combinedData);
};
var deleteTodo = async ({ url }) => {
  const todos = await get("todos") ?? [];
  const idMaybe = url.searchParams.get("id");
  if (!idMaybe)
    return null;
  const id = parseInt(idMaybe);
  const cleanedTodos = todos.filter((x) => x !== id);
  await set("todos", cleanedTodos);
  await del(id);
  return "";
};
var toggleComplete = async ({ url }) => {
  const idMaybe = url.searchParams.get("id");
  if (!idMaybe)
    return null;
  const id = parseInt(idMaybe);
  const oldData = await get(id);
  const newData = { ...oldData, completed: !oldData.completed };
  await set(id, newData);
  return todoView(newData);
};
var toggleAll = async ({}) => {
  const todos = await get("todos") ?? [];
  const todoData = await getMany(todos);
  const completed = !todoData.every((x) => x.completed);
  const newData = todoData.map((x) => ({ ...x, completed }));
  await Promise.all(newData.map((x) => set(x.id, x)));
  return newData.map(todoView).join("");
};
var clearCompleted = async ({}) => {
  const todos = await get("todos") ?? [];
  const todoData = await getMany(todos);
  const completed = todoData.filter((x) => x.completed).map((x) => x.id);
  await Promise.all(completed.map((x) => del(x)));
  await set("todos", todos.filter((x) => !completed.includes(x)));
  return todoData.filter((x) => !x.completed).map(todoView).join("");
};
function todoView({ completed, title, id }) {
  let statusClass = completed ? ` class="completed"` : "";
  let idString = `row-${id}`;
  return e2`
    <li$${statusClass} id="$${idString}">
        <form method="post" target="#$${idString}" hf-swap="outerHTML">
            <input
                class="toggle"
                type="checkbox"
                ${completed ? "checked" : ""}
                formaction="/todos?handler=toggle-complete&id=${"" + id}"
                onchange="this.form.requestSubmit()"
                >
            <label
                class="view"
                ondblclick="$(this).closest('li').addClass('editing').find('.edit').focus()"
                >${title}</label>
            <button class="destroy" formaction="/todos?handler=delete&id=${"" + id}"></button>
            <input
                class="edit"
                value="${title}"
                name="title"
                autocomplete="off"
                formaction="/?handler=update&id=${"" + id}"
                onblur="$(this).closest('li').removeClass('editing')"
                onkeydown="event.keyCode === $.ESC_KEY && $(this).closest('li').removeClass('editing')"
                >
        </form>
    </li>`;
}

// src-todo/sw.ts
var version = "0.0.1";
var root = self.location.pathname.replace("/sw.js", "");
self.addEventListener("install", (e3) => {
  console.log(`Installing version '${version}' service worker.`);
  e3.waitUntil(
    caches.open(version).then((cache) => cache.addAll([
      "/js/app.js",
      "/js/sw-loader.js",
      "/js/lib/htmf.js",
      "/css/base.css",
      "/css/index.css",
      "/css/app.css"
    ].map((x) => root + x)))
  );
});
self.addEventListener("fetch", (e3) => e3.respondWith(getResponse(e3)));
self.addEventListener("activate", async (e3) => {
  console.log(`Service worker activated. Cache version '${version}'.`);
  const keys = await caches.keys();
  if (e3.waitUntil) {
    let cacheDeletes = keys.map((x) => version !== x && caches.delete(x)).filter((x) => x);
    if (cacheDeletes.length === 0)
      return;
    e3.waitUntil(Promise.all(cacheDeletes));
  }
});
async function getResponse(e3) {
  const url = new URL(e3.request.url);
  console.log(`Fetching '${url.pathname}'`);
  if (url.pathname === root + "/" && e3.request.method === "GET") {
    const index = await getAll();
    return new Response(index, {
      headers: {
        "Content-Type": "text/html",
        "hf-events": `{"todos-updated": ""}`
      }
    });
  }
  const handler = url.searchParams.get("handler");
  if (handler) {
    return handle(handler, e3.request, url);
  }
  return caches.match(url.pathname);
}
async function handle(handler, request, url) {
  const data = await getData(request, url);
  const opt = { request, url, data };
  let task = null;
  switch (handler) {
    case "create":
      task = createTodo(opt);
      break;
    case "update":
      task = updateTodo(opt);
      break;
    case "delete":
      task = deleteTodo(opt);
      break;
    case "toggle-complete":
      task = toggleComplete(opt);
      break;
    case "toggle-all":
      task = toggleAll(opt);
      break;
    case "clear-completed":
      task = clearCompleted(opt);
      break;
    default:
      return new Response("Unknown handler", { status: 400 });
  }
  const result = await task;
  if (result == null)
    return new Response(null, { status: 204 });
  return new Response(result, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      "hf-events": `{"todos-updated": ""}`
    }
  });
}
async function getData(req, url) {
  let o = {};
  if (req.method === "GET") {
    url.searchParams.forEach((val, key) => o[key] = val);
    return o;
  }
  if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    formData.forEach((val, key) => o[key] = val);
  } else if (req.headers.get("Content-Type")?.includes("json")) {
    o = await req.json();
  }
  return o;
}
