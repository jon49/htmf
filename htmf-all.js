// @ts-check
// @ts-ignore
hf = (function () {

    document.querySelectorAll("[hf-hidden]").forEach(x => x instanceof HTMLElement && (x.style.visibility = "hidden"))

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

            const contentType_ = response.headers.get("content-type")

            const contentType =
                contentType_.indexOf("application/json") > -1
                    ? "json"
                : contentType_.indexOf("html") > -1
                    ? "html"
                : "text"
            if (contentType && contentType.indexOf("application/json") !== -1) {
                let data = JSON.parse(await response.json())
                document.dispatchEvent(new CustomEvent("received-json", { bubbles: false, detail: {data, form: $form, button: $button} }))
            } else {
                let text = await response.text()
                htmlSwap({contentType: contentType, text, form: $form})
            }
        }
        catch (ex) {
            console.error(ex)
            var $form = e?.target
            if ($form instanceof HTMLFormElement) $form.submit()
        }
    })

    /**
     * @param {{contentType:"html"|"json"|"text",text:string|undefined,form:HTMLFormElement}} data 
     * @returns 
     */
    function htmlSwap(data) {
        if (data.contentType !== "html") return

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

    const debounced = {}

    /**
     * @param {Function} func 
     * @param {string} key 
     * @param {DebounceOptions} option 
     */
    function debounce(func, key, option = { args: [], wait: 50, isImmediate: false, immediateFirst: false }) {
        if (!debounced[key]) {
            debounced[key] = option
        }
        const options = debounced[key]
        let timeoutId = options.timeoutId
        const context = this
        const doLater = function () {
            timeoutId = void 0
            if (!options.isImmediate) {
                func.apply(context, options.args);
            }
        };
        const shouldCallNow = (options.isImmediate || options.immediateFirst) && timeoutId === undefined;
        options.immediateFirst = false;
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        options.timeoutId = setTimeout(doLater, options.wait);
        if (shouldCallNow) {
            func.apply(context, options.args);
        }
    }

    /**
     * @param {HTMLInputElement} self 
     */
    function click(self) {
        var $form = self.form
        if (!$form) return
        ($form.querySelector("button") || $form.querySelector("[type='submit']"))?.click()
    }

    return { debounce, click }

})()