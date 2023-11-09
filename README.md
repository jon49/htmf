# HTMF

`htmf` is a minimalist library similar to HTMX and other technologies
(Behavior.js, unpoly, etc.) designed to work directly with forms. It has a
minimal API. It also makes it easy to build Multipage apps (MPA) which works
without JavaScript and the JS is just progressive enhancement.

`htmf` is 2.9 kB minified and 1.7 kB minified and zipped.

A Todo MVC example [can be found here](https://jon49.github.io/htmf/todo/#).

## Core functionality

Use forms just like you normally would, but instead of calling through the
normal paths `htmf` will take over the call and the partial HTML returned
will be parsed back into the HTML. When the `htmf` library makes a call to
the back end it will add the header `HF-Request: true` to the HTTP call.

Use `hf-target` in the calling form or button to decide where the returning `HTML`
will be placed. Defaults to the form itself.

`hf-target` defaults to a swap of `innerHTML`.

If you don't want it to replace the contents you can add the attribute
`hf-swap` with types `outerHTML`, `innerHTML`, `beforebegin`, `afterbegin`,
`beforeend`, `afterend`, `append`, `prepend`, `outerHTML` (replace), and `oob`
for out-of-bound replacements (matches on the IDs of the elements).

If you would like a form to not be controlled by `htmf` place the attribute
`hf-ignore` on the form or on the submit button.

If you would like to dispatch a custom event send back the header `hf-events`
with a JSON value with the name of the events as keys.

## Auto scrolling and focusing

HTMF will automatically keep the active element in focus and at the same
scrolling location after an HTMF swap. These extra scrolling attributes will
help you fine tune any changes you would like.

`hf-scroll-to`: After load scroll to specified queried element.

`hf-scroll-target`: Target a different element than the default one.

`hf-scroll-miss`: If the target scroll element is missing use the
`hf-scroll-miss` defined query instead.

`hf-skip-focus`: Don't focus on element.

`hf-skip-scroll`: Don't autoscroll to element.

## Snappy pages

If you would like your app to be a bit snappier consider using the JavaScript
library instant.page.

## Version

### 0.5.0

Improved scrolling experience. Made it more like
[mpa-enhancer](https://github.com/jon49/mpa-enhancer).

### 0.4.0

Add ability to scroll target a location on a page after swapping in new HTML.

### 0.3.0

Basically a rewrite.

- Improved scrolling.
- Use `hf-target` instead of `target`.
- Added more `hf-swap` types similar to `HTMX` which works with
  `insertAdjacentHTML`.
- Use `submitter` instead of `activeElement` to determine override of form
  values.
- 204 response is now ignored

### 0.20

- Removed the 205 event in favor of more generalized events.
- Added more similar events to what HTMX has but more limited.
- Made events have the capability of being asynchronous. This allows for adding
  classes.
- Swap with event rather than directly calling it. This will allow for
  extensions that add a class to the newly created HTML.

### 0.10

Introduced event for return status of 205 (Reset Content).

### 0.8

Fixed bug when a button which created the event doesn't exist.

### 0.7

Added more events and made events cancelable.

Added events: `hf:completed` and `hf:redirected`.

### 0.6

Added auto scroll for when appending above the input.

### 0.51

Bug fix - `preventDefault()` wasn't called.  
Bug fix - For http status of 204 or 400 don't print content type error message.

### 0.5

Removed `click` and `submit` methods as [`requestSubmit` is
available](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit).
Note, [a polyfill](https://github.com/javan/form-request-submit-polyfill) might be needed.

Removed `debounce` helper (which removes all helpers for this project). Just use
[underscore.js](https://github.com/jashkenas/underscore/) or any other library
implementation of it.

### 0.4

Added ability to submit the form directly through `htmf`. Removed the ability of
`click` to submit the form through the button click.

### 0.3

Prevent double submits. Added ability to send events from `JSON` in a header.
Added ability to delete elements with empty string.

### 0.2

Default to `innerHTML` swap type. Determine target from the form itself.

### 0.1

Removed `hf-hidden` attribute as this is redundant - use the `noscript` html tag
instead.
