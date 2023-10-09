import html from "html-template-tag-stream"

export default function layout(count: number, enableJS: boolean, todos?: AsyncGenerator<any, void, unknown> | AsyncGenerator<any, void, unknown>[]) {
    // @ts-ignore
    return html`
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>HTMF • TodoMVC</title>
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
                method="post"
                action="/todos?handler=create"
                hf-target="#todo-list"
                hf-swap="beforeend"
                >
            <input
                id="new-todo"
                class="new-todo"
                placeholder="What needs to be done?"
                ${ count === 0 ? 'autofocus' : null }
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
                hf-target="#todo-list"
                onchange="this.requestSubmit()"
                >
                <input id="toggle-all" class="toggle-all" type="checkbox">
                <label for="toggle-all">Mark all as complete</label>
            </form>
            <ul id="todo-list" class="todo-list">${todos}</ul>
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
            <!-- Hidden if no completed items are left ↓ -->
            <form
                method="post"
                action="/todos?handler=clear-completed"
                hf-target="#todo-list"
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
        <p><form method=post action="?handler=toggle-js"><button>${enableJS ? "Disable JS" : "Enable JS"}</button></form></p>
        <p><a href="https://github.com/jon49/htmf/tree/master/src-todo">Source Code</a></p>
        <p>Created by <a href="https://jnyman.com">Jon Nyman</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
    </footer>
    <!-- Scripts here. Don't remove ↓ -->
    <script src="./js/app.js"></script>
    ${ enableJS ? html`<script src="./js/lib/htmf.js"></script>` : null }
</body>
</html>`
}

