"use strict";
(() => {
  self.hf = {};
  hf.version = "0.5.0";
  const hasAttr = (attribute) => (el) => el?.hasAttribute(attribute);
  let doc = document;
  let w = window;
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
      if (response.status === 205) {
        let url2 = response.headers.get("location");
        url2 && (location.href = url2);
        return;
      }
      const contentType = response.headers.get("content-type"), hasContent = response.status !== 204;
      if (hasContent && contentType?.includes("application/json")) {
        let data = JSON.parse(await response.json());
        await publish($originator, "hf:json", { ...eventData, data });
      } else if (hasContent && contentType?.includes("html")) {
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
  function htmlSwap({ text, form, submitter }) {
    if (text == null)
      return;
    beforeUnload(submitter, form);
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
  let lastClick = null;
  w.addEventListener("click", (e) => {
    if (e.target instanceof Element) {
      lastClick = e.target;
    }
  });
  let pageLocation;
  function beforeUnload(submitter, form) {
    let active = doc.activeElement;
    let target = active === doc.body ? lastClick : active;
    let to = getAttribute([submitter, form].find(hasAttr("hf-scroll-to")), "hf-scroll-to");
    let scrollTarget = getAttribute(target, "hf-scroll-target");
    if (scrollTarget) {
      target = query(scrollTarget);
    }
    let miss = getAttribute(target?.closest("[hf-scroll-miss]"), "hf-scroll-miss");
    let name = getAttribute(target, "name");
    pageLocation = {
      y: w.scrollY,
      to,
      // active
      a: {
        // target
        t: { y: calculateY(target), q: target?.id && `#${target.id}` || name && `[name="${name}"]` },
        // miss
        // @ts-ignore
        m: { y: calculateY(query(miss)), q: miss }
      }
    };
  }
  function onLoad() {
    if (!pageLocation)
      return;
    let { y, to, a: { t, m } } = pageLocation;
    if (to) {
      let $scrollTo = query(to);
      if ($scrollTo) {
        return $scrollTo.scrollIntoView({ behavior: "smooth" });
      }
    }
    let active;
    let elY = t.q && (active = query(t.q)) ? t.y : m.q && (active = query(m.q)) ? m.y : 0;
    if (!hasAttr("hf-skip-focus")(active)) {
      run("focus", active);
      run("select", active);
    }
    if (!hasAttr("hf-skip-scroll")(doc.body)) {
      if (active && elY) {
        w.scrollTo({
          top: w.scrollY + calculateY(active) - elY
        });
      } else {
        w.scrollTo({ top: y });
      }
    }
  }
  function calculateY(el) {
    return el?.getBoundingClientRect().top;
  }
  function run(method, el) {
    el && el[method] && el[method]();
  }
})();
