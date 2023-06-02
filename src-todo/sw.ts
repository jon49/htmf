import {
    clearCompleted,
    createTodo,
    deleteTodo,
    getAll,
    toggleAll,
    toggleComplete,
    updateTodo,
} from "./server/actions.js"

const version = "0.0.1"
const root = self.location.pathname.replace('/sw.js', '')

self.addEventListener("install", e => {
    console.log(`Installing version '${version}' service worker.`)
    // @ts-ignore
    e.waitUntil(
        caches.open(version)
        // @ts-ignore
        .then(cache => cache.addAll([
            "/js/app.js",
            "/js/sw-loader.js",
            "/js/lib/htmf.js",
            "/css/base.css",
            "/css/index.css",
            "/css/app.css",
        ].map(x => root + x))))
})

// @ts-ignore
self.addEventListener("fetch", (e: FetchEvent) => e.respondWith(getResponse(e)))

// @ts-ignore
self.addEventListener("activate", async (e: ExtendableEvent) => {
    console.log(`Service worker activated. Cache version '${version}'.`)
    const keys = await caches.keys()
    if (e.waitUntil) {
        let cacheDeletes =
                keys
                .map((x: string) => ((version !== x) && caches.delete(x)))
                .filter(x => x)
        if (cacheDeletes.length === 0) return
        e.waitUntil(Promise.all(cacheDeletes))
    }
})

async function getResponse(e: FetchEvent) {
    const url = new URL(e.request.url)
    console.log(`Fetching '${url.pathname}'`)
    if (url.pathname === root + "/" && e.request.method === "GET") {
        const index = await getAll()
        return new Response(index, {
            headers: {
                "Content-Type": "text/html",
                "hf-events": `{"todos-updated": ""}`,
            } })
    }

    const handler = url.searchParams.get("handler")
    if (handler) {
        return handle(handler, e.request, url)
    }

    return caches.match(url.pathname)
}

async function handle(handler: string, request: Request, url: URL) {
    const data = await getData(request, url)
    const opt = { request, url, data }
    let task = null
    switch (handler) {
        case "create":
            task = createTodo(opt)
            break
        case "update":
            task = updateTodo(opt)
            break
        case "delete":
            task = deleteTodo(opt)
            break
        case "toggle-complete":
            task = toggleComplete(opt)
            break
        case "toggle-all":
            task = toggleAll(opt)
            break
        case "clear-completed":
            task = clearCompleted(opt)
            break
        default:
            return new Response("Unknown handler", { status: 400 })
    }

    const result = await task
    if (result == null) return new Response(null, { status: 204 })
    return new Response(result, {
        status: 200,
        headers: {
            "Content-Type": "text/html",
            "hf-events": `{"todos-updated": ""}`,
        } })
}

async function getData(req: Request, url: URL) {
    let o : any = {}
    if (req.method === "GET") {
        url.searchParams.forEach((val, key) => o[key] = val)
        return o
    }

    if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData()
        formData.forEach((val, key) => o[key] = val)
    } else if (req.headers.get("Content-Type")?.includes("json")) {
        o = await req.json()
    }
    return o
}

