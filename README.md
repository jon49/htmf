# HTMF

`htmf` is a minimalist library similar to HTMX and other technologies
(Behavior.js, unpoly, etc.) designed to work directly with forms. It has a
minimal API. It also makes it easy to build Multipage apps (MPA) which works
without JavaScript and the JS is just progressive enhancement.

`htmf` is 1.64 kB minified and 1.0 kB minified and zipped which is about
1/10th the size of HTMX.

Use forms just like you normally would, but instead of calling through the
normal paths `htmf` will take over the call and the partial HTML returned
will be parsed back into the HTML.

Use `id` or `target` attributes in the return `HTML` to give a target
otherwise it will replace the `body`.

`target` defaults to a swap of `append` rather than `replace`.

If you don't want it to replace the contents you can add the attribute
`hf-swap` with types `append`, `prepend`, and `replace`.

After a swap it will search for `autofocus` attribute and focus on that
element.

If you would like a form to not be controlled by `htmf` place the attribute
`hf-ignore` on the form or on the submit button.

If you would like some buttons hidden once the HTML is loaded use the
attribute `hf-hidden`.

If `application/json` is returned an event called `received-json` will be
dispatched the `detail` will contain the form which initiated the call, the
parsed data, and the button which initiated the call.

A couple of helper functions are included in `htmf-extensions.js` available
through the `hf` global variable. `debounce` which allows you to debounce a
function. It also includes `click` which will click a button in the current
form.

You can get the main library and extensions in the `htmf-all.js` file.

If you would like your app to be a bit snappier consider using the JavaScript
library intant.page.
