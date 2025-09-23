import { routeHandler } from "./routes.js"

self.addEventListener("install", _ => self.skipWaiting())

self.addEventListener("fetch", e => e.respondWith(getResponse(e)))

self.addEventListener("activate", _ => clients.claim())

async function getResponse(e) {
  const url = new URL(e.request.url)

  url.pathname = normalizePathname(url.pathname)

  let response
  if (response = routeHandler(url)) {
    return response
  }

  return fetch(url)
  .then(x => {
    return x
  })
  .catch(e => {
    return new Response("Not Found", { status: 404 })
  })
}

function normalizePathname(path) {
  let lastSlash = path.lastIndexOf("/")
  let lastPeriod = path.lastIndexOf(".")
  if (lastPeriod > lastSlash) {
    return path
  } else if (path.endsWith("/")) {
    return path
  } else {
    return `${path}/`
  }
}