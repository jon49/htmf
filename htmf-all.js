(() => {
  document.querySelectorAll("[hf-hidden]").forEach((x) => x instanceof HTMLElement && (x.style.visibility = "hidden"));
  document.addEventListener("submit", async (e) => {
    try {
      const $form2 = e.target;
      const $button = document.activeElement;
      if ($form2.hasAttribute("hf-ignore") || $button.hasAttribute("hf-ignore"))
        return;
      e.preventDefault();
      const preData = new FormData($form2);
      const method = $button.formMethod || $form2.method;
      const url = new URL($button.getAttribute("formAction") && $button.formAction || $form2.action);
      const options = {method, credentials: "same-origin", headers: new Headers({"HF-Request": "true"})};
      if (method === "post") {
        options.body = new URLSearchParams([...preData]);
      } else {
        const query = new URLSearchParams(preData).toString();
        if (query) {
          url.search += (url.search ? "&" : "?") + query;
        }
      }
      const response = await fetch(url.href, options);
      if (response.redirected) {
        location.href = response.url;
        return;
      }
      const contentType_ = response.headers.get("content-type");
      const contentType = contentType_.indexOf("application/json") > -1 ? "json" : contentType_.indexOf("html") > -1 ? "html" : "text";
      if (contentType && contentType.indexOf("application/json") !== -1) {
        let data = JSON.parse(await response.json());
        document.dispatchEvent(new CustomEvent("received-json", {bubbles: false, detail: {data, form: $form2, button: $button}}));
      } else {
        let text = await response.text();
        htmlSwap({contentType, text, form: $form2});
      }
    } catch (ex) {
      console.error(ex);
      var $form = e?.target;
      if ($form instanceof HTMLFormElement)
        $form.submit();
    }
  });
  function htmlSwap(data) {
    if (data.contentType !== "html")
      return;
    const template = document.createElement("template");
    template.innerHTML = data.text.trim();
    for (const el of template.content.childNodes) {
      if (!(el instanceof HTMLElement))
        continue;
      const query = el.getAttribute("target");
      let target;
      let swapType;
      if (query) {
        target = document.querySelector(query);
        swapType = el.getAttribute("hf-swap") || "append";
      } else if (el.id) {
        target = document.getElementById(el.id);
      } else {
        target = document.body;
      }
      if (!target) {
        target = data.form;
      }
      switch (swapType) {
        case "append":
          target.append(el);
          break;
        case "prepend":
          target.prepend(el);
          break;
        case "replace":
        default:
          target.replaceWith(el);
      }
    }
    var $focus = document.querySelector("[autofocus]");
    if ($focus instanceof HTMLElement) {
      $focus.removeAttribute("autofocus");
      $focus.focus();
    }
  }
  const debounced = {};
  function debounce(func, key, option = {args: [], wait: 50, isImmediate: false, immediateFirst: false}) {
    if (!debounced[key]) {
      debounced[key] = option;
    }
    const options = debounced[key];
    let timeoutId = options.timeoutId;
    const context = this;
    const doLater = function() {
      timeoutId = void 0;
      if (!options.isImmediate) {
        func.apply(context, options.args);
      }
    };
    const shouldCallNow = (options.isImmediate || options.immediateFirst) && timeoutId === void 0;
    options.immediateFirst = false;
    if (timeoutId !== void 0) {
      clearTimeout(timeoutId);
    }
    options.timeoutId = setTimeout(doLater, options.wait);
    if (shouldCallNow) {
      func.apply(context, options.args);
    }
  }
  function click(self) {
    var $form = self.form;
    if (!$form)
      return;
    ($form.querySelector("button") || $form.querySelector("[type='submit']"))?.click();
  }
  hf = {debounce, click};
})();
