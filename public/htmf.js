(() => {
  self.hf = {};
  hf.version = "0.2";
  document.addEventListener("submit", async (e) => {
    try {
      const $form2 = e.target;
      const $button = document.activeElement;
      if ($form2.hasAttribute("hf-ignore") || $button.hasAttribute("hf-ignore"))
        return;
      e.preventDefault();
      const preData = new FormData($form2);
      const method = $button.formMethod || $form2.method;
      const url = new URL($button.hasAttribute("formAction") && $button.formAction || $form2.action);
      const options = { method, credentials: "same-origin", headers: new Headers({ "HF-Request": "true" }) };
      if (method === "post") {
        options.body = new URLSearchParams([...preData]);
      } else {
        for (let e2 of preData.entries()) {
          url.searchParams.append(...e2);
        }
      }
      const response = await fetch(url.href, options);
      if (response.redirected) {
        location.href = response.url;
        return;
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") > -1) {
        let data = JSON.parse(await response.json());
        $button.dispatchEvent(new CustomEvent("hf:json", { bubbles: true, detail: { data, form: $form2, button: $button } }));
      } else if (contentType && contentType.indexOf("html") > -1) {
        let text = await response.text();
        htmlSwap({ text, form: $form2, button: $button });
      } else {
        console.error(`Unhandled content type "${contentType}"`);
      }
    } catch (ex) {
      console.error(ex);
      var $form = e?.target;
      if ($form instanceof HTMLFormElement)
        $form.submit();
    }
  });
  function getAttribute(el, attributeName) {
    return el.getAttribute(attributeName);
  }
  function getHtml(text) {
    const template = document.createElement("template");
    template.innerHTML = text.trim();
    return template.content;
  }
  function htmlSwap({ text, form, button }) {
    if (!text)
      return;
    let target = getAttribute(button, "target") ?? getAttribute(form, "target");
    let swap = getAttribute(button, "hf-swap") ?? getAttribute(form, "hf-swap") ?? "innerHTML";
    let $target = (target ? document.querySelector(target) : form) ?? form;
    switch (swap) {
      case "innerHTML":
        $target.innerHTML = text;
        break;
      case "outerHTML":
        $target.outerHTML = text;
        break;
      case "append":
        $target.append(getHtml(text));
        break;
      case "prepend":
        $target.prepend(getHtml(text));
        break;
      case "replace":
        $target.replaceWith(getHtml(text));
        break;
      case "oob":
        for (let el of getHtml(text).childNodes) {
          if (!(el instanceof HTMLElement))
            continue;
          let targetId = el.id ?? el.dataset.id;
          let $t = document.getElementById(targetId);
          if (!$t) {
            console.warn(`The target ${targetId} could not be found for swap.`);
            continue;
          }
          $t.replaceWith(el);
        }
        break;
      default:
        console.warn(`Unknown swap type: "${swap}".`);
    }
    var $focus = document.querySelector("[autofocus]");
    if ($focus instanceof HTMLElement) {
      $focus.removeAttribute("autofocus");
      $focus.focus();
    }
  }
})();
