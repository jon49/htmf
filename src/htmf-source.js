// @ts-check

// @ts-ignore
self.hf = {}
hf.version = "0.10"

const has =
    (/** @type {string} */ attribute) =>
    (/** @type {{ hasAttribute: (arg0: string) => any; }|undefined} */ el) =>
        el?.hasAttribute(attribute)

const inFlight = new WeakMap

/**
 * @param {{ dispatchEvent: (arg0: CustomEvent<any>) => void; }} el
 * @param {string} eventName
 * @param {any} detail
 * @returns {boolean}
 */
function publish(el, eventName, detail) {
    // @ts-ignore
    return el.dispatchEvent(new CustomEvent(eventName, { bubbles: true, cancelable: true, detail }))
}

// @ts-ignore
document.addEventListener("submit", async e => {
    /** @type {HTMLFormElement} */
    // @ts-ignore
    const $form = e instanceof HTMLFormElement ? e : e.target

    /** @type {HTMLButtonElement|HTMLInputElement|undefined} */
    // @ts-ignore
    let $button = document.activeElement
    if ($button?.form !== $form) $button = void 0
    const $originator = $button ?? $form

    if ([$form, $button].find(has("hf-ignore"))) return
    e?.preventDefault()

    if (inFlight.get($form)) {
        return
    } else {
        inFlight.set($form, true)
    }

    const method = $button?.formMethod || $form.method
    const eventData = { form: $form, button: $button, method }

    try {

        const preData = new FormData($form)
        const url = new URL((has("formAction")($button) && $button?.formAction) || $form.action)
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
        // @ts-ignore
        const response = await fetch(url.href, options)

        if (response.redirected) {
            location.href = response.url
            return
        }
        if (response.status === 205) {
            let url = response.headers.get("location")
            if (publish($originator, "hf:reset-content", { ...eventData, url }) && url) {
                location.href = url
            }
            return
        }

        const contentType = response.headers.get("content-type")

        if (contentType && contentType.indexOf("application/json") > -1) {
            let data = JSON.parse(await response.json())
            publish($originator, "hf:json", {...eventData, data})
        } else if (contentType && contentType.indexOf("html") > -1) {
            let text = await response.text()
            htmlSwap({...eventData, text})
        } else {
            if (![204, 400].includes(response.status))
                console.error(`Unhandled content type "${contentType}"`)
        }

        let maybeEvents = response.headers.get("hf-events")
        try {
            if (maybeEvents) {
                let events = JSON.parse(maybeEvents)
                for (let [eventName, detail] of Object.entries(events)) {
                    publish($originator, eventName, detail)
                }
            }
        } catch (ex) {
            console.error(ex, maybeEvents)
        }
    } catch (ex) {
        console.error(ex)
        if ($form instanceof HTMLFormElement) $form.submit()
    } finally {
        inFlight.delete($form)
        publish($originator, "hf:completed", eventData)
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
    const template = document.createElement("template")
    template.innerHTML = text.trim()
    return template.content
}

/**
 * @param {{ text: string|undefined, form: HTMLFormElement, button: HTMLButtonElement | HTMLInputElement | undefined }} data 
 * @returns 
 */
function htmlSwap({text, form, button}) {
    if (text === void 0) return

    beforeUnload()

    let target = getAttribute(button, "target") ?? getAttribute(form, "target")
    let swap = getAttribute(button, "hf-swap") ?? getAttribute(form, "hf-swap") ?? "innerHTML"

    let $target = (target ? document.querySelector(target) : form) ?? form

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
        case "oob":
            for (let el of getHtml(text).childNodes) {
                if (!(el instanceof HTMLElement)) continue
                let targetId = el.id ?? el.dataset.id
                let $t = document.getElementById(targetId)
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

    var $focus = document.querySelector("[autofocus]")
    if ($focus instanceof HTMLElement) {
        $focus.removeAttribute("autofocus")
        $focus.focus()
    } else if(![form, button].find(has("hf-ignore-scroll"))) {
        onLoad()
    }

}

let pageLocation
function beforeUnload() {
    pageLocation = { y: window.scrollY, height: document.body.scrollHeight }
}

function onLoad() {
    if (!pageLocation) return
    let { y, height } = pageLocation
    if (y) {
        let scrollToY = y + document.body.scrollHeight - height
        if (scrollToY !== y)
            window.scrollTo({ top: scrollToY, behavior: 'smooth' })
    }
}
