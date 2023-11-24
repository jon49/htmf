
// @ts-ignore
self.hf = {}
hf.version = "0.6.0"

const hasAttr =
    (/** @type {string} */ attribute) =>
    (/** @type {{ hasAttribute: (arg0: string) => any; }|undefined} */ el) =>
        el?.hasAttribute(attribute)

let doc = document,
    w = window,
    query = doc.querySelector.bind(doc)

const inFlight = new WeakMap

/**
 * @param {Element} el
 * @param {string} eventName
 * @param {any} detail
 * @returns {Promise<undefined>}
 */
async function publish(el, eventName, detail) {
    if (!el.isConnected) {
        // @ts-ignore
        el = doc
    }
    let result = el.dispatchEvent(new CustomEvent(eventName, { bubbles: true, cancelable: true, detail }))
    if (detail?.wait) await detail.wait()
    if (!result) return Promise.reject()
    return
}

const publishAfter = []

doc.addEventListener("hf:swap", async e => {
    /** @type {{ detail: { text: string|undefined, form: HTMLFormElement, button: HTMLButtonElement | HTMLInputElement | undefined }}} */
    // @ts-ignore
    const { detail } = e
    // @ts-ignore
    htmlSwap(detail)
})

// @ts-ignore
doc.addEventListener("submit", async e => {
    const active = doc.activeElement

    /** @type {HTMLFormElement} */
    // @ts-ignore
    const form = e.target

    /** @type {HTMLButtonElement|HTMLInputElement|undefined} */
    // @ts-ignore
    const submitter = e.submitter,
          $originator = submitter ?? form

    if ([form, submitter].find(hasAttr("hf-ignore"))) return
    e.preventDefault()

    if (inFlight.has(form)) {
        return
    } else {
        // @ts-ignore
        inFlight.set(form)
    }

    const method = submitter?.formMethod || form.method
    /** @type {{ form: HTMLFormElement, submitter: HTMLButtonElement | HTMLInputElement | undefined, active: Element | null, method: string, xhr?: { url: URL, options: any, response?: Response } }} */
    const eventData = { form, submitter, method, active }

    try {
        const preData = new FormData(form)
        let pathname
        if (pathname = getAttribute(submitter, "formaction")) {
        } else {
            pathname = getAttribute(form, "action")
        }
        pathname = pathname ?? location.pathname
        // @ts-ignore
        let url =
            pathname.startsWith("?")
                ? new URL(pathname, form.baseURI)
            : new URL(pathname, location.origin)

        const options = { method, credentials: "same-origin", headers: new Headers({ "HF-Request": "true" }) }
        if (method === "post") {
            // @ts-ignore
            options.body = new URLSearchParams([...preData])
        } else if (method === "get") {
            for (let e of preData.entries()) {
                // @ts-ignore
                url.searchParams.append(...e)
            }
        } else {
            return
        }
        eventData.xhr = { url, options }
        await publish($originator, "hf:beforeRequest", eventData)
        // @ts-ignore
        const response = await fetch(url.href, options)
        eventData.xhr.response = response
        await publish($originator, "hf:afterRequest", eventData)

        if (response.redirected) {
            location.href = response.url
            return
        }
        if (response.status === 205) {
            let url = response.headers.get("location")
            url && (location.href = url)
            return
        }

        const contentType = response.headers.get("content-type"),
            hasContent = response.status !== 204
        if (hasContent && contentType?.includes("application/json")) {
            let data = JSON.parse(await response.json())
            await publish($originator, "hf:json", {...eventData, data})
        } else if (hasContent && contentType?.includes("html")) {
            let text = await response.text()
            await publish($originator, "hf:swap", {...eventData, text})
        } else if (response.status < 200 || response.status > 399) {
            await publish($originator, "hf:responseError", eventData)
        }

        let maybeEvents = response.headers.get("hf-events")
        try {
            if (maybeEvents) {
                let events = JSON.parse(maybeEvents)
                await
                    Promise.all(
                        Object.entries(events)
                        .map(([eventName, detail]) =>
                            publish($originator, eventName, detail)))
            }
        } catch (ex) {
            console.error(ex, maybeEvents)
        }
    } catch (ex) {
        console.error(ex)
        if (form instanceof HTMLFormElement) form.submit()
    } finally {
        inFlight.delete(form)
        await publish($originator, "hf:completed", eventData)
        setTimeout(() => {
            publishAfter.map(p => p())
            publishAfter.length = 0
        }, 10)
    }
})

/**
 * @param {HTMLElement | undefined} el 
 * @param {string} attributeName 
 * @returns {string | null | undefined}
 */
function getAttribute(el, attributeName) {
    return el?.getAttribute(attributeName)
}

/**
 * @param {string} text
 * @return {DocumentFragment}
 */
function getHtml(text) {
    const template = doc.createElement("template")
    template.innerHTML = text.trim()
    return template.content
}

/**
 * @param {{ text: string|undefined, form: HTMLFormElement, active: Element | null, submitter: HTMLButtonElement | HTMLInputElement | undefined }} data 
 * @returns 
 */
function htmlSwap({text, form, submitter}) {
    if (text == null) return

    beforeUnload(submitter, form)

    let target = getAttribute(submitter, "hf-target") ?? getAttribute(form, "hf-target")
    let swap = getAttribute(submitter, "hf-swap") ?? getAttribute(form, "hf-swap") ?? "innerHTML"
    let select = getAttribute(submitter, "hf-select") ?? getAttribute(form, "hf-select")
    if (select) {
        swap = "select"
    }

    let $target = (target ? query(target) : form) ?? form

    switch (swap) {
        case "innerHTML":
            $target.innerHTML = text
            executeScripts($target)
            break
        case "outerHTML":
            $target.outerHTML = text
            executeScripts($target)
            break
        case "append":
            $target.append(getHtml(text))
            executeScripts($target)
            break
        case "prepend":
            $target.prepend(getHtml(text))
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
            // @ts-ignore
            let $newSelects = Array.from(getHtml(text).querySelectorAll(select))
            // @ts-ignore
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

    if(![form, submitter].find(hasAttr("hf-ignore-scroll"))) {
        onLoad()
    }
}

let scripts = new Set()
/**
* @param {Element} container
* @returns {void}
* */
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
            newScript.setAttribute(attr.name, attr.value)
        }
        newScript.appendChild(doc.createTextNode(oldScript.innerHTML))
        oldScript.replaceWith(newScript)
        publishScriptLoad(container, newScript)
    }
}

/**
* @param {Element} container
* @param {HTMLScriptElement} script
* @returns {void}
* */
function publishScriptLoad(container, script) {
    publishAfter.push(() => publish(container, "hf:script:load", { script: ["src", "id"].map(x => getAttribute(script, x)).find(x => x) }))
}

/** Recenter page depending on how updated data occurred. **/

let lastClick = null
w.addEventListener('click', e => {
    lastClick = e.target
})

/**
* @typedef {{ y: number | undefined, q: string | null | undefined }} ScrollTarget
**/

/** @type {{ y: number | undefined, to: string | undefined | null, a: { t: ScrollTarget, m: ScrollTarget } }} | undefined} */
let pageLocation

/**
* @param {HTMLButtonElement | HTMLInputElement | undefined} submitter
* @param {HTMLFormElement} form
* @returns {void}
* */
function beforeUnload(submitter, form) {
    let active = doc.activeElement
    let target = active === doc.body ? lastClick : active
    let to = getAttribute([submitter, form].find(hasAttr("hf-scroll-to")), "hf-scroll-to")
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
    let $focus = query('[autofocus]')
    if ($focus) {
        $focus.focus()
        $focus.scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'center'
        })
        return
    }
    if (!pageLocation) return
    let { y, to, a: { t, m } } = pageLocation
    let $scrollTo = query(to)
    if ($scrollTo) {
        return $scrollTo.scrollIntoView({ behavior: 'smooth' })
    }

    let active
    let elY =
        (t.q && (active = query(t.q)))
            ?  t.y
        : (m.q && (active = query(m.q)))
            ?  m.y
        : 0
    if (!hasAttr('hf-skip-focus')(active)) {
        run('focus', active)
        run('select', active)
    }

    if (!hasAttr('hf-skip-scroll')(doc.body)) {
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

/**
* @param {Element | null} el
* @returns {number | undefined}
* */
function calculateY(el) {
    return el?.getBoundingClientRect().top
}

/**
* @param {string} method
* @param {Element} el
* */
function run(method, el) {
    // @ts-ignore
    el && el[method] && el[method]()
}


