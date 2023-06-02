"use strict";
(() => {
  // src-todo/js/query.ts
  var Query = class {
    constructor(nodes = []) {
      this.nodes = nodes;
    }
    addClass(className) {
      this.nodes.forEach((x) => x.classList.add(className));
      return this;
    }
    removeClass(className) {
      this.nodes.forEach((x) => x.classList.remove(className));
      return this;
    }
    classWhen(className, condition) {
      if (condition) {
        this.addClass(className);
      } else {
        this.removeClass(className);
      }
      return this;
    }
    closest(selector) {
      return query(this.nodes[0]?.closest(selector));
    }
    find(selector) {
      return this.nodes[0] ? query(selector, this.nodes[0]) : query();
    }
    focus() {
      const el = this.nodes[0];
      if (el instanceof HTMLElement) {
        el.focus();
      }
      return this;
    }
    get length() {
      return this.nodes.length;
    }
    text(value) {
      this.nodes.forEach((x) => {
        x.textContent = value ?? "";
      });
      return this;
    }
    html(value) {
      this.nodes.forEach((x) => {
        x.innerHTML = value ?? "";
      });
      return this;
    }
    [Symbol.iterator]() {
      let index = -1;
      let nodes = this.nodes;
      return {
        next: () => ({
          value: nodes[++index],
          done: !(index in nodes)
        })
      };
    }
  };
  function query(val = null, el = null) {
    if (val == null) {
      return new Query([]);
    }
    if (val instanceof Element) {
      return new Query([val]);
    }
    return new Query(Array.from((el ?? document).querySelectorAll(val)));
  }
  query.ESC_KEY = 27;
  query.ENTER_KEY = 13;
  window.$ = query;

  // src-todo/js/app.ts
  document.addEventListener("todos-updated", todosUpdated);
  var incompleteTodosCache = null;
  function getIncompleteTodos() {
    return incompleteTodosCache == null ? incompleteTodosCache = query("#todo-list > li:not(.completed)").length : incompleteTodosCache;
  }
  var totalTodosCache = null;
  function getTotalTodos() {
    return totalTodosCache == null ? totalTodosCache = query("#todo-list > li").length : totalTodosCache;
  }
  var completedTodosCache = null;
  function getCompletedTodos() {
    return completedTodosCache == null ? completedTodosCache = query("#todo-list > li.completed").length : completedTodosCache;
  }
  function pluralize(count) {
    return count === 1 ? "" : "s";
  }
  window.app = {
    getIncompleteTodos,
    getTotalTodos,
    getCompletedTodos,
    pluralize
  };
  var map = /* @__PURE__ */ new WeakMap();
  function todosUpdated(e) {
    incompleteTodosCache = totalTodosCache = completedTodosCache = null;
    for (const el of query('[x-subscribe^="todos-updated:"')) {
      let handler = map.get(el);
      if (!handler) {
        handler = parseCode(el) ?? (() => {
        });
        map.set(el, handler);
      }
      handler?.call(el, e);
    }
    updateFilter();
  }
  function parseCode(el) {
    const code = el.getAttribute("x-subscribe") ?? "";
    return new Function("event", code.split(":")[1] + "; return;");
  }
  window.addEventListener("hashchange", handleHashChange);
  function updateFilter() {
    const hash = window.location.hash, listQuery = "#todo-list > li";
    query(listQuery).removeClass("hidden");
    if (hash === "#/active") {
      query(listQuery + ".completed").addClass("hidden");
    } else if (hash === "#/completed") {
      query(listQuery + ":not(.completed)").addClass("hidden");
    }
  }
  function handleHashChange() {
    const hash = window.location.hash;
    query(".filters > li > a").removeClass("selected");
    query(`.filters > li > a[href="${hash}"]`).addClass("selected");
    updateFilter();
  }
  handleHashChange();
  todosUpdated();
})();
