(() => {
  self.hf = {};
  hf.version = "0.2";
  const has = (attribute) => (el) => el?.hasAttribute(attribute);
  const inFlight = /* @__PURE__ */ new WeakMap();
  async function publish(el, eventName, detail) {
    if (!el.isConnected) {
      el = document;
    }
    let result = el.dispatchEvent(new CustomEvent(eventName, { bubbles: true, cancelable: true, detail }));
    if (detail?.wait)
      await detail.wait();
    if (!result)
      return Promise.reject();
    return;
  }
  document.addEventListener("hf:swap", async (e) => {
    const { detail } = e;
    htmlSwap(detail);
  });
  document.addEventListener("submit", async (e) => {
    const $form = e instanceof HTMLFormElement ? e : e.target;
    let $button = document.activeElement;
    if ($button?.form !== $form)
      $button = void 0;
    const $originator = $button ?? $form;
    if ([$form, $button].find(has("hf-ignore")))
      return;
    e?.preventDefault();
    if (inFlight.get($form)) {
      return;
    } else {
      inFlight.set($form, 1);
    }
    const method = $button?.formMethod || $form.method;
    const eventData = { form: $form, button: $button, method };
    try {
      const preData = new FormData($form);
      const url = new URL(has("formAction")($button) && $button?.formAction || $form.action);
      const options = { method, credentials: "same-origin", headers: new Headers({ "HF-Request": "true" }) };
      if (method === "post") {
        options.body = new URLSearchParams([...preData]);
      } else {
        for (let e2 of preData.entries()) {
          url.searchParams.append(...e2);
        }
      }
      eventData.xhr = { url, options };
      await publish($originator, "hf:beforeRequest", eventData);
      const response = await fetch(url.href, options);
      eventData.xhr.response = response;
      await publish($originator, "hf:afterRequest", eventData);
      if (response.redirected) {
        location.href = response.url;
        return;
      }
      if (response.status === 205) {
        let url2 = response.headers.get("location");
        url2 && (location.href = url2);
        return;
      }
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        let data = JSON.parse(await response.json());
        await publish($originator, "hf:json", { ...eventData, data });
      } else if (contentType?.includes("html")) {
        let text = await response.text();
        await publish($originator, "hf:swap", { ...eventData, text });
      } else if (response.status < 200 || response.status > 399) {
        await publish($originator, "hf:responseError", eventData);
      }
      let maybeEvents = response.headers.get("hf-events");
      try {
        if (maybeEvents) {
          let events = JSON.parse(maybeEvents);
          await Promise.all(
            Object.entries(events).map(([eventName, detail]) => publish($originator, eventName, detail))
          );
        }
      } catch (ex) {
        console.error(ex, maybeEvents);
      }
    } catch (ex) {
      console.error(ex);
      if ($form instanceof HTMLFormElement)
        $form.submit();
    } finally {
      inFlight.delete($form);
      await publish($originator, "hf:completed", eventData);
    }
  });
  function getAttribute(el, attributeName) {
    return el?.getAttribute(attributeName);
  }
  function getHtml(text) {
    const template = document.createElement("template");
    template.innerHTML = text.trim();
    return template.content;
  }
  function htmlSwap({ text, form, button }) {
    if (text == null)
      return;
    beforeUnload();
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
    } else if (![form, button].find(has("hf-ignore-scroll"))) {
      onLoad();
    }
  }
  let pageLocation;
  function beforeUnload() {
    pageLocation = { y: window.scrollY, height: document.body.scrollHeight };
  }
  function onLoad() {
    if (!pageLocation)
      return;
    let { y, height } = pageLocation;
    if (y) {
      let scrollToY = y + document.body.scrollHeight - height;
      if (scrollToY !== y)
        window.scrollTo({ top: scrollToY, behavior: "smooth" });
    }
  }
})();