"use strict";
(() => {
  let doc = document;
  let w = window;
  let submitting = "hf-submitting";
  let hfTarget = "hf-target";
  let hfSwap = "hf-swap";
  let hf = "hf";
  let send = (elt, type, detail, bub, prefix = null) => {
    let el = elt.isConnected ? elt : doc;
    return el.dispatchEvent(new CustomEvent(
      (prefix ?? "hf:") + type,
      { detail, cancelable: true, bubbles: bub !== false, composed: true }
    ));
  };
  let attr = (elt, name, defaultVal) => elt.getAttribute(name) || defaultVal;
  let getAttr = (name, defaultVal) => (elt) => attr(elt, name, defaultVal);
  let setAttr = (el, attributeName, value) => el?.setAttribute(attributeName, value);
  let hasAttr = (attribute) => (el) => el?.hasAttribute(attribute);
  let transition = document.startViewTransition?.bind(document);
  let getAttrAndEl = (attributeName) => (el) => {
    let value = attr(el, attributeName);
    if (value) return [value, el];
  };
  let swapOption = {};
  let htmf = {
    swapOption,
    fetch: w.fetch.bind(w),
    send,
    attr,
    hasAttr
  };
  w.htmf = htmf;
  doc.addEventListener("submit", async (e) => {
    const active = doc.activeElement, form = e.target, submitter = e.submitter, originator = submitter ?? form, submitters = [submitter, form].filter((x) => x);
    if (submitters.find(hasAttr("hf-ignore")) || ![hfTarget, hf, hfSwap].find((x) => submitters.find(hasAttr(x)))) {
      return;
    }
    e.preventDefault();
    if (hasAttr(submitting)(originator)) return;
    setAttr(originator, submitting, "");
    let method = submitter?.formMethod || form.method;
    let action = hasAttr("formaction")(submitter) && submitter.formAction || form.action;
    let url = new URL(action);
    let options = {};
    try {
      let preData = new FormData(form);
      let [targetQuery, targetEl] = submitters.map(getAttrAndEl(hfTarget)).find((x) => x) ?? submitters.map(getAttrAndEl("target")).find((x) => x) ?? [];
      let swap = submitters.map(getAttr(hfSwap)).find((x) => x) || attr(doc.body, hfSwap) || "outerHTML";
      let target = targetQuery && document.querySelector(targetQuery) || targetEl || submitter || form;
      options = {
        action,
        active,
        credentials: "same-origin",
        event: e,
        form,
        headers: new Headers({ "HF-Request": "true" }),
        method,
        originator,
        submitter,
        swap,
        target,
        transition,
        url
      };
      if (method === "get") {
        for (let e2 of preData.entries()) {
          url.searchParams.append(...e2);
        }
      } else {
        options.body = new URLSearchParams([...preData]);
      }
      if (!send(originator, "before", options)) return;
      let response = options.response = await htmf.fetch(url, options);
      if (!send(originator, "after", options)) return;
      if (response.redirected && response.status > 299 && response.status < 400) {
        location.href = response.url;
        return;
      }
      if (response.status === 204) {
        return;
      }
      options.text = await response.text();
      if (!send(originator, "swap", options)) return;
      let doSwap = () => {
        if (swapOption[swap] instanceof Function)
          return swapOption[swap](options);
        else if (/(before|after)(begin|end)/.test(swap))
          target.insertAdjacentHTML(swap, options.text);
        else if (swap in target)
          target[swap] = options.text;
        else if (swap !== "none") throw `Unknown swap: ${swap}`;
      };
      if (options.transition) {
        await options.transition(doSwap).finished;
      } else {
        await doSwap();
      }
      send(originator, "swapped", options);
      if (!document.contains(target)) send(doc, "swapped", options);
    } catch (ex) {
      console.error(ex);
      if (submitter instanceof HTMLFormElement) {
        submitter.submit();
      } else {
        submitter?.click();
      }
    } finally {
      originator.removeAttribute(submitting);
      send(originator, "completed", options);
    }
  });
})();
