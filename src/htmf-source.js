// @ts-check

document.addEventListener("submit", async e => {
    try {
        /** @type {HTMLFormElement} */
        // @ts-ignore
        const $form = e.target
        /** @type {HTMLButtonElement|HTMLInputElement} */
        // @ts-ignore
        const $button = document.activeElement

        if ($form.hasAttribute("hf-ignore") || $button.hasAttribute("hf-ignore")) return
        e.preventDefault()

        const preData = new FormData($form)
        const method = $button.formMethod || $form.method
        const url = new URL(($button.getAttribute("formAction") && $button.formAction) || $form.action)
        const options = { method, credentials: "same-origin", headers: new Headers({ "HF-Request": "true" }) }
        if (method === "post") {
            // @ts-ignore
            options.body = new URLSearchParams([...preData])
        } else {
            // @ts-ignore
            const query = new URLSearchParams(preData).toString()
            if (query) {
                url.search += (url.search ? "&" : "?") + query
            }
        }
        // @ts-ignore
        const response = await fetch(url.href, options)

        if (response.redirected) {
            location.href = response.url
            return
        }

        const contentType = response.headers.get("content-type")

        if (contentType && contentType.indexOf("application/json") !== -1) {
            let data = JSON.parse(await response.json())
            document.dispatchEvent(new CustomEvent("received-json", { bubbles: false, detail: {data, form: $form, button: $button} }))
        } else if (contentType && contentType.indexOf("html") > -1) {
            let text = await response.text()
            htmlSwap({text, form: $form})
        } else {
            console.error(`Unhandled content type "${contentType}"`)
        }
    }
    catch (ex) {
        console.error(ex)
        var $form = e?.target
        if ($form instanceof HTMLFormElement) $form.submit()
    }
})

/**
 * @param {{text:string|undefined,form:HTMLFormElement}} data 
 * @returns 
 */
function htmlSwap(data) {
    if (!data.text) return
    const template = document.createElement("template")
    template.innerHTML = data.text.trim()
    for (const el of template.content.childNodes) {
        if (!(el instanceof HTMLElement)) continue
        const query = el.getAttribute("target")
        let target
        let swapType
        if (query) {
            target = document.querySelector(query)
            swapType = el.getAttribute("hf-swap") || "append"
        } else if (el.id) {
            target = document.getElementById(el.id)
        } else {
            target = document.body
        }
        if (!target) { target = data.form }
        switch (swapType) {
            case "append":
                target.append(el)
                break
            case "prepend":
                target.prepend(el)
                break
            case "replace":
            default:
                target.replaceWith(el)
        }
    }
    var $focus = document.querySelector("[autofocus]")
    if ($focus instanceof HTMLElement) {
        $focus.removeAttribute("autofocus")
        $focus.focus()
    }
}
