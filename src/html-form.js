let doc = document,
    w = window,
    query = doc.querySelector.bind(doc),
    submitting = "hf-submitting"

doc.addEventListener("submit", async e => {
    const active = doc.activeElement,
          form = e.target,
          submitter = e.submitter,
          originator = submitter ?? form

    const method =
        (getAttribute(submitter, "formmethod")
        ?? getAttribute(form, "method")
        ?? "get").toLowerCase()

    if (
        !(method === "get" || method === "post")
        || [form, submitter].find(hasAttr("hf-ignore"))) return
    e.preventDefault()

    if (hasAttr(submitting)(submitter ?? form)) return
    setAttribute(originator, submitting, "")

    let action =
        getAttribute(submitter, "formaction")
        ?? getAttribute(form, "action")
        ?? ""

    let url = new URL(action, w.location)

    const eventData = { form, submitter, method, active, originator, action, url }

    try {
        const preData = new FormData(form)

        const options = {
            method,
            credentials: "same-origin",
            headers: new Headers({ "HF-Request": "true" }) }

        if (method === "post") {
            options.body = new URLSearchParams([...preData])
        // "get"
        } else {
            for (let e of preData.entries()) {
                url.searchParams.append(...e)
            }
        }

        eventData.xhr = { url, options }
        await publish(originator, "hf:request-before", eventData)

        const response = await fetch(url, options)
        eventData.xhr.response = response
        await publish(originator, "hf:request-after", eventData)

        if (response.redirected) {
            location.href = response.url
            return
        }

        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
            let data = JSON.parse(await response.json())
            await publish(originator, "hf:json", {...eventData, data})
        } else if (contentType?.includes("html")) {
            let text = await response.text()
            let data =  { ...eventData, text }
            await publish(originator, "hf:swap", data)
            htmlSwap(data)
        } else if (!response.ok) {
            await publish(originator, "hf:response-error", eventData)
        }

        if (response.headers.has("hf-reset")) {
            form.reset();
        }

        let maybeEvents = response.headers.get("hf-events")
        if (maybeEvents) {
            let events = JSON.parse(maybeEvents)
            await
                Promise.all(
                    Object.entries(events)
                    .map(([eventName, detail]) =>
                        publish(originator, eventName, detail)))
        }

    } catch (ex) {

        console.error(ex)
        setAttribute(form, "action", eventData.action)
        setAttribute(form, "method", eventData.method)
        run("submit", form)

    } finally {

        originator.removeAttribute(submitting)
        await publish(originator, "hf:completed", eventData)

    }
})

function htmlSwap({text, form, submitter}) {
    if (text == null) return

    beforeUnload(submitter, form)

    let submitters = [submitter, form]
    let target = mapFirst(getAttr("hf-target"), submitters)
    let swap = mapFirst(getAttr("hf-swap"), submitters) ?? "innerHTML"
    let select = mapFirst(getAttr("hf-select"), submitters)
    let originator = submitter ?? form
    if (select) {
        swap = "select"
    }

    let $target = (target ? query(target) : originator) ?? originator

    switch (swap) {
        case "outerHTML":
        case "innerHTML":
            $target[swap] = text
            executeScripts($target)
            break
        case "append":
        case "prepend":
            let html = getHtml(text)
            $target[swap](html)
            executeScripts(html)
            break
        case "beforebegin":
        case "afterbegin":
        case "beforeend":
        case "afterend":
            $target.insertAdjacentHTML(swap, text)
            break
        case "oob":
            for (let el of getHtml(text).childNodes) {
                if (!(el instanceof HTMLElement)) continue
                let targetId = el.id ?? el.dataset.id
                let $t = doc.getElementById(targetId)
                if (!$t) {
                    console.warn(`The target ${targetId} could not be found for swap.`)
                    continue
                }
                $t.replaceWith(el)
                executeScripts(el)
            }
            break
        case "select":
            let $newSelects = Array.from((typeof text === "string" ? getHtml(text) : text).querySelectorAll(select))
            let $oldSelects = Array.from(doc.querySelectorAll(select))
            for (let i = 0; i < $oldSelects.length; i++) {
                let $new = $newSelects[i],
                    $old = $oldSelects[i]
                if (!$old || !$new) continue
                $old.replaceWith($new)
                executeScripts($new)
            }
            break
        default:
            console.warn(`Unknown swap type: "${swap}".`)
    }

    if(!submitters.find(hasAttr("hf-scroll-ignore"))) {
        onLoad()
    }
}

function selectSwap(select, html, skipScripts = false) {
    let $newSelects = Array.from(html.querySelectorAll(select))
    let $oldSelects = Array.from(doc.querySelectorAll(select))
    for (let i = 0; i < $oldSelects.length; i++) {
        let $new = $newSelects[i],
            $old = $oldSelects[i]
        if (!$old || !$new) continue
        $old.replaceWith($new)
        if (!skipScripts) executeScripts($new)
    }
}

let scripts = new Set()
function executeScripts(container) {
    for (let oldScript of container.querySelectorAll("script")) {
        let scriptIdentifier = oldScript.src || oldScript.id
        if (scripts.has(scriptIdentifier)) {
            publishScriptLoad(container, oldScript)
            continue
        }
        scripts.add(scriptIdentifier)
        const newScript = doc.createElement("script")
        for (let attr of oldScript.attributes) {
            setAttribute(newScript, attr.name, attr.value)
        }
        newScript.appendChild(doc.createTextNode(oldScript.innerHTML))
        oldScript.replaceWith(newScript)
        publishScriptLoad(container, newScript)
    }
}

function publishScriptLoad(container, script) {
    publish(container, "hf:script-loaded", {
        script: mapFirst(x => getAttribute(script, x), ["src", "id"])
    }, 10)
}

/** Recenter page depending on how updated data occurred. **/

let lastClick = null
w.addEventListener('click', e => {
    lastClick = e.target
})

let pageLocation

function beforeUnload(submitter, form) {
    let active = doc.activeElement
    let target = active === doc.body ? lastClick : active
    let to = mapFirst(getAttr("hf-scroll-to"), [submitter, form])
    let scrollTarget = getAttribute(target, 'hf-scroll-target')
    if (scrollTarget) {
        target = query(scrollTarget)
    }
    let miss = getAttribute(target?.closest('[hf-scroll-miss]'), 'hf-scroll-miss')
    let name = getAttribute(target, "name")
    pageLocation = {
        y: w.scrollY,
        to,
        // active
        a: {
            // target
            t: { y: calculateY(target), q: (target?.id && `#${target.id}`) || (name && `[name="${name}"]`) },
            // miss
            m: { y: calculateY(query(miss)), q: miss }
        }
    }
}

function onLoad() {
    let focus = query("[autofocus]")
    if (focus) {
        focus.focus()
        return focus.scrollIntoView({
            behavior: "auto",
            block: "center",
            inline: "center"
        })
    }

    if (!pageLocation) return
    let { y, to, a: { t, m } } = pageLocation

    let scrollTo = query(to)
    if (scrollTo) {
        return scrollTo.scrollIntoView({ behavior: "smooth" })
    }

    let active
    let elY =
        (t.q && (active = query(t.q)))
            ?  t.y
        : (m.q && (active = query(m.q)))
            ?  m.y
        : 0
    if (!hasAttr("hf-focus-skip")(active)) {
        run("focus", active)
        run("select", active)
    }

    if (!hasAttr("hf-scroll-skip")(doc.body)) {
        if (active && elY) {
            // Scroll to where element was before
            w.scrollTo({
                top:
                    w.scrollY
                    // @ts-ignore
                    + calculateY(active)
                    - elY
            })
        } else {
            // Scroll to where page was before
            w.scrollTo({ top: y })
        }
    }
}

function calculateY(el) {
    return el?.getBoundingClientRect().top
}

async function publish(el, eventName, detail, wait) {
    if (!el.isConnected) {
        el = doc
    }
    if (wait) {
        setTimeout(() => publish(el, eventName, detail), wait)
    }
    let result = el.dispatchEvent(new CustomEvent(eventName, { bubbles: true, cancelable: true, detail }))
    if (detail?.wait) await detail.wait()
    if (!result) return Promise.reject()
    return
}

function run(method, el) {
    el?.[method] instanceof Function && el[method]()
}

function mapFirst(fn, xs) {
    for (let x of xs) {
        let result = fn(x)
        if (result) return result
    }
}

function hasAttr(attribute) {
    return (el) =>
        el?.hasAttribute(attribute)
}


function getAttr(attributeName) {
    return el => getAttribute(el, attributeName)
}

function getAttribute(el, attributeName) {
    if (el?.hasAttribute(attributeName)) return el.getAttribute(attributeName)
    return undefined
}

function setAttribute(el, attributeName, value) {
    el?.setAttribute(attributeName, value)
}

function getHtml(text) {
    const template = doc.createElement("template")
    template.innerHTML = text
    return template.content
}

window.htmf = {
    selectSwap,
    publish,
}

