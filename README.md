# HTMF

`htmf` is a minimalist library similar to HTMX and other technologies
(Behavior.js, unpoly, etc.) designed to work directly with forms. It has a
minimal API. It also makes it easy to build Multipage apps (MPA) which works
without JavaScript and the JS is just progressive enhancement.

`htmf` is 2.04 kB minified and 1.19 kB minified and zipped.

Use forms just like you normally would, but instead of calling through the
normal paths `htmf` will take over the call and the partial HTML returned
will be parsed back into the HTML. When the `htmf` library makes a call to
the back end it will add the header `HF-Request: true` to the HTTP call.

Use `target` in the calling form or button to decide where the returning `HTML`
will be placed. Defaults to the form itself.

`target` defaults to a swap of `innerHTML`.

If you don't want it to replace the contents you can add the attribute
`hf-swap` with types `append`, `prepend`, `outerHTML` (replace), and `oob` for
out-of-bound replacements (matches on the IDs of the elements).

After a swap it will search for `autofocus` attribute and focus on that
element.

If you would like a form to not be controlled by `htmf` place the attribute
`hf-ignore` on the form or on the submit button.

If `application/json` is returned an event called `hf:json` will be
dispatched the `detail` will contain the form which initiated the call, the
parsed data, and the button which initiated the call.

If you would like to dispatch a custom event send back the header `hf-events`
with a JSON value with the name of the events as keys.

If you would like your app to be a bit snappier consider using the JavaScript
library instant.page.

## Version

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
