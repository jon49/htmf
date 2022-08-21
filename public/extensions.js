(() => {
  const debounced = {};
  function debounce(func, key, option = { args: [], wait: 50, isImmediate: false, immediateFirst: false }) {
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
  function click(target) {
    if (typeof target === "string") {
      let $target = document.querySelector(target);
      if ($target instanceof HTMLElement) {
        $target.click();
      }
    } else {
      var $form = target.form;
      if (!$form)
        return;
      ($form.querySelector("button") || $form.querySelector("[type='submit']"))?.click();
    }
  }
  hf = { debounce, click };
})();
