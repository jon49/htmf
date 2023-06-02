import $ from './query.js'

document.addEventListener('todos-updated', todosUpdated)

let incompleteTodosCache : number | null = null
function getIncompleteTodos() {
    return incompleteTodosCache == null
        ? incompleteTodosCache = $('#todo-list > li:not(.completed)').length
    : incompleteTodosCache
}

let totalTodosCache : number | null = null
function getTotalTodos() {
    return totalTodosCache == null
        ? totalTodosCache = $('#todo-list > li').length
    : totalTodosCache
}

let completedTodosCache : number | null = null
function getCompletedTodos() {
    return completedTodosCache == null
        ? completedTodosCache = $('#todo-list > li.completed').length
    : completedTodosCache
}

function pluralize(count: number) {
    return count === 1 ? '' : 's'
}

// @ts-ignore
window.app = {
    getIncompleteTodos,
    getTotalTodos,
    getCompletedTodos,
    pluralize,
}

const map = new WeakMap<Element, (this: Element, event: Event) => void>()
function todosUpdated(e: Event) {
    incompleteTodosCache = totalTodosCache = completedTodosCache = null

    for (const el of $('[x-subscribe^="todos-updated:"')) {
        let handler = map.get(el)
        if (!handler) {
            // @ts-ignore
            handler = parseCode(el) ?? (() => {})
            // @ts-ignore
            map.set(el, handler)
        }
        handler?.call(el, e)
    }

    updateFilter()
}

function parseCode(el: Element) {
    const code = el.getAttribute('x-subscribe') ?? ""
    return new Function('event', code.split(':')[1] + "; return;")
}

window.addEventListener('hashchange', handleHashChange)

function updateFilter() {
    const hash = window.location.hash,
        listQuery = '#todo-list > li'
    $(listQuery).removeClass('hidden')
    if (hash === '#/active') {
        $(listQuery+'.completed').addClass('hidden')
    } else if (hash === '#/completed') {
        $(listQuery+':not(.completed)').addClass('hidden')
    }
}

function handleHashChange() {
    const hash = window.location.hash
    $('.filters > li > a').removeClass('selected')
    $(`.filters > li > a[href="${hash}"]`).addClass('selected')
    updateFilter()
}

handleHashChange()
todosUpdated()

