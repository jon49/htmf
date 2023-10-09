import html from "html-template-tag-stream"
// @ts-ignore
import { get, getMany, set, del } from "idb-keyval"
import layout from "./layout.js"

interface RequestOptions {
    request: Request
    url: URL
    data: any
}
export type Handler =
    (o: RequestOptions) => Promise<AsyncGenerator<any, void, unknown> | AsyncGenerator<any, void, unknown>[] | null | undefined>

interface Settings {
    enableJS: boolean
}

interface Todo {
    completed: boolean
    title: string
    id: number
}

export const getAll = async () => {
    let [ todos, { enableJS } ] = await Promise.all([getTodos(), getSettings()])
    let count = todos.length
    if (count === 0) return layout(0, enableJS)
    const todoViews = todos.map(todoView)
    return layout(count, enableJS, todoViews)
}

export async function getSettings() {
    const settings : Settings = (await get("settings")) ?? { enableJS: true }
    return settings
}

async function getTodoIds() {
    const todos : number[] = (await get("todos")) ?? []
    return todos
}

async function getTodos() {
    const todos : number[] = await getTodoIds()
    if (todos.length === 0) return []
    const todoData : Todo[] = await getMany(todos)
    return todoData
}


export const createTodo : Handler = async({ data }) => {
    if (data.title === "") return null
    const todos : number[] = (await get("todos")) ?? []
    const newTodoId = Date.now()
    todos.push(newTodoId)
    await set("todos", todos)
    const newData = { ...data, completed: false, id: newTodoId }
    await set(newTodoId, newData)
    return todoView(newData)
}

export const updateTodo : Handler = async ({ url, data }) => {
    const idMaybe = url.searchParams.get("id")
    if (!idMaybe) return null
    const id = parseInt(idMaybe)
    const oldData = await get(id)
    const combinedData = { ...oldData, ...data }
    await set(id, combinedData)
    return todoItem(combinedData.title, combinedData.id)
}

export const deleteTodo : Handler = async ({ url }) => {
    const todos : number[] = (await get("todos")) ?? []
    const idMaybe = url.searchParams.get("id")
    if (!idMaybe) return null
    const id = parseInt(idMaybe)
    const cleanedTodos = todos.filter(x => x !== id)
    await set("todos", cleanedTodos)
    await del(id)
    return null
}

export const toggleComplete : Handler = async ({ url }) => {
    const idMaybe = url.searchParams.get("id")
    if (!idMaybe) return null
    const id = parseInt(idMaybe)
    const oldData = await get(id)
    const newData = { ...oldData, completed: !oldData.completed }
    await set(id, newData)
    return todoView(newData)
}

export const toggleAll : Handler = async ({ }) => {
    const todos : number[] = (await get("todos")) ?? []
    const todoData : Todo[] = await getMany(todos)
    const completed = !todoData.every(x => x.completed)
    const newData = todoData.map(x => ({ ...x, completed: completed }))
    await Promise.all(newData.map(x => set(x.id, x)))
    return html`${newData.map(todoView)}`
}

export const clearCompleted : Handler = async ({ }) => {
    const todos : number[] = (await get("todos")) ?? []
    const todoData : Todo[] = await getMany(todos)
    const completed = todoData.filter(x => x.completed).map(x => x.id)
    await Promise.all(completed.map(x => del(x)))
    await set("todos", todos.filter(x => !completed.includes(x)))
    return html`${todoData.filter(x => !x.completed).map(todoView)}`
}

export const toggleJS : Handler = async () => {
    const settings = await getSettings()
    settings.enableJS = !settings.enableJS
    await set("settings", settings)
}

function todoView({ completed, title, id }: Todo) {
    let completedClass = completed ? "completed" : ""
    let liClass = `class="${completedClass}"`
    // @ts-ignore
    return html`
    <li id="row-${id}" $${liClass}>
        <form method="post"
              action="?handler=toggle-complete&id=${id}"
              hf-target="#row-${id}"
              hf-swap="outerHTML">
            <button
                id="toggle_${"" + id}"
                class="toggle button-toggle"
                type="checkbox"
            >$${completed ? "&#10004;" : ""}</button>
        </form>
        <form method="post">${todoItem(title, id)}</form>
    </li>`
}

function todoItem(title: string, id: number) {
    return html`
<div>
    <input
        id="edit_${id}"
        class="edit"
        value="${title}"
        name="title"
        autocomplete="off" >
    <label for="edit_${id}" class="view">${title} &#9998;</label>
    <button hidden formaction="?handler=update&id=${id}"></button>
</div>
<button
    class="destroy"
    formaction="?handler=delete&id=${id}"
    hf-target="#row-${id}"
    hf-swap="outerHTML"
    ></button>`
}

