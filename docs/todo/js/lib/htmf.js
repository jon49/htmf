"use strict";
(() => {
  self.hf = {};
  hf.version = "0.2";
  const hasAttr = (attribute) => (el) => el?.hasAttribute(attribute);
  let doc = document;
  let query = doc.querySelector.bind(doc);
  const inFlight = /* @__PURE__ */ new WeakMap();
  async function publish(el, eventName, detail) {
    if (!el.isConnected) {
      el = doc;
    }
    let result = el.dispatchEvent(new CustomEvent(eventName, { bubbles: true, cancelable: true, detail }));
    if (detail?.wait)
      await detail.wait();
    if (!result)
      return Promise.reject();
    return;
  }
  doc.addEventListener("hf:swap", async (e) => {
    const { detail } = e;
    htmlSwap(detail);
  });
  doc.addEventListener("submit", async (e) => {
    const active = doc.activeElement;
    const form = e.target;
    const submitter = e.submitter, $originator = submitter ?? form;
    if ([form, submitter].find(hasAttr("hf-ignore")))
      return;
    e.preventDefault();
    if (inFlight.has(form)) {
      return;
    } else {
      inFlight.set(form);
    }
    const method = submitter?.formMethod || form.method;
    const eventData = { form, submitter, method, active };
    try {
      const preData = new FormData(form);
      const url = new URL(hasAttr("formAction")(submitter) && submitter?.formAction || form.action);
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
      if (response.status === 204) {
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
      if (form instanceof HTMLFormElement)
        form.submit();
    } finally {
      inFlight.delete(form);
      await publish($originator, "hf:completed", eventData);
    }
  });
  function getAttribute(el, attributeName) {
    return el?.getAttribute(attributeName);
  }
  function getHtml(text) {
    const template = doc.createElement("template");
    template.innerHTML = text.trim();
    return template.content;
  }
  function htmlSwap({ text, form, submitter, active }) {
    if (text == null)
      return;
    beforeUnload(active);
    let target = getAttribute(submitter, "hf-target") ?? getAttribute(form, "hf-target");
    let swap = getAttribute(submitter, "hf-swap") ?? getAttribute(form, "hf-swap") ?? "innerHTML";
    let $target = (target ? query(target) : form) ?? form;
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
      case "beforebegin":
      case "afterbegin":
      case "beforeend":
      case "afterend":
        $target.insertAdjacentHTML(swap, text);
        break;
      case "oob":
        for (let el of getHtml(text).childNodes) {
          if (!(el instanceof HTMLElement))
            continue;
          let targetId = el.id ?? el.dataset.id;
          let $t = doc.getElementById(targetId);
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
    if (![form, submitter].find(hasAttr("hf-ignore-scroll"))) {
      onLoad();
    }
  }
  let pageLocation;
  function beforeUnload(active) {
    let name = active?.name, id = active?.id;
    pageLocation = {
      y: calculateY(active),
      q: id && `#${id}` || name && `[name="${name}"]`,
      height: doc.body.scrollHeight
    };
  }
  function onLoad() {
    if (!pageLocation)
      return;
    let {
      y,
      q
      /*, height */
    } = pageLocation;
    let $q = q && query(q);
    if ($q) {
      run("focus", $q);
      run("select", $q);
      $q.scrollTo({ top: y, behavior: "smooth" });
    }
  }
  function calculateY(el) {
    return el?.getBoundingClientRect().top;
  }
  function run(method, el) {
    el && el[method] && el[method]();
  }
})();
