// @ts-check

// @ts-ignore
self.hf = {}
hf.version = "0.2"

const hasAttr =
    (/** @type {string} */ attribute) =>
    (/** @type {{ hasAttribute: (arg0: string) => any; }|undefined} */ el) =>
        el?.hasAttribute(attribute)

let doc = document,
    //w = window,
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
        const url = new URL((hasAttr("formAction")(submitter) && submitter?.formAction) || form.action)
        const options = { method, credentials: "same-origin", headers: new Headers({ "HF-Request": "true" }) }
        if (method === "post") {
            // @ts-ignore
            options.body = new URLSearchParams([...preData])
        } else {
            for (let e of preData.entries()) {
                // @ts-ignore
                url.searchParams.append(...e)
            }
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
        if (response.status === 204) {
            return
        }
        if (response.status === 205) {
            let url = response.headers.get("location")
            url && (location.href = url)
            return
        }

        const contentType = response.headers.get("content-type")

        if (contentType?.includes("application/json")) {
            let data = JSON.parse(await response.json())
            await publish($originator, "hf:json", {...eventData, data})
        } else if (contentType?.includes("html")) {
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
function htmlSwap({text, form, submitter, active}) {
    if (text == null) return

    beforeUnload(active)

    let target = getAttribute(submitter, "hf-target") ?? getAttribute(form, "hf-target")
    let swap = getAttribute(submitter, "hf-swap") ?? getAttribute(form, "hf-swap") ?? "innerHTML"

    let $target = (target ? query(target) : form) ?? form

    switch (swap) {
        case "innerHTML":
            $target.innerHTML = text
            break
        case "outerHTML":
            $target.outerHTML = text
            break
        case "append":
            $target.append(getHtml(text))
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
            }
            break
        default:
            console.warn(`Unknown swap type: "${swap}".`)
    }

    if(![form, submitter].find(hasAttr("hf-ignore-scroll"))) {
        onLoad()
    }

}


/** Recenter page depending on how updated data occurred. **/

/** @type {{ y: number | undefined, q: string | undefined, height: number } | undefined} */
let pageLocation
/**
* @param {Element | null} active
* @returns {void}
* */
function beforeUnload(active) {
    // @ts-ignore
    let name = active?.name,
        id = active?.id
    pageLocation = {
        y: calculateY(active),
        q: (id && `#${id}`) || (name && `[name="${name}"]`),
        height: doc.body.scrollHeight
    }
}

function onLoad() {
    if (!pageLocation) return
    let { y, q /*, height */ } = pageLocation
    let $q = q && query(q)
    if ($q) {
        run('focus', $q)
        run('select', $q)
        $q.scrollTo({ top: y, behavior: 'smooth' })
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

