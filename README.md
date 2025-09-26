# HTML Form Handler

`html-form` (`htmf`) is a minimalist library similar to HTMX and other
technologies (Behavior.js (RIP), unpoly, fixi, etc.) designed to work directly
with forms. It has a minimal API. It also makes it easy to build Multipage apps
(MPA) which works without JavaScript and the JS is just progressive enhancement.

I have successfully created offline-first applications with this library. I have
also successfully used it to create an offline-first, SPA, PWA application.

`htmf` is 1.9 kB minified and 1.3 kB minified and zipped.

Tests can be viewed here: <https://jon49.github.io/htmf/>

## Overview

This JavaScript code provides functionality for handling HTML form submissions
with added features such as asynchronous submission, AJAX requests, and dynamic
content updates.

## Features

1. Asynchronous Form Submission:
    - The code listens for form submission events and handles them
      asynchronously using the Fetch API.
2. Event Pub-Sub System:
    - Utilizes a simple event-publishing and subscribing system to allow for
      customization and extensibility.
3. Dynamic Content Updates:
    - Supports dynamic content updates based on the response from the server,
      including JSON and HTML responses.
4. If you know HTML forms then you know how to use this library.

## Installation

Copy the file from the source code `public/html-form.js` or the minified version
`public/html-form.min.js`.

Or use `npm` `npm i html-form` and reference it like so `import "html-form"`.

## Usage

### Example

When clicking the button below it will retrieve the HTML from `/foo` and replace
the content in the `button` element.

```html
<form method="post" action="/foo" hf>
  <button>Submit</button>
</form>
```

This will replace the button element with the returned HTML from `/foo`. This
uses a button outside of the defined `form`. Native HTML for the win!

```html
<button form="get" formaction="/foo" hf-swap="outerHTML">Submit</button>
<form id="get" hidden></form>
```

This will replace the target element.

```html
<div id="myDiv">I will be replaced.</div>
<button form="get" formaction="/foo" target="#myDiv" hf-swap="outerHTML">Submit</button>
<form id="get" hidden></form>
```

### Extensions

- `html-form-events`
  - Create events from the reponse header.
- `html-form-scroll`
  - Auto scroll to where you were before when content changes.
  - Target scroll position after changing content.
- `html-form-confirm`
  - When you would like to confirm a form submission.
- `html-form-merge`
  - This uses `Morphdom` to merge the two HTML DOM elements.
  - This is useful when you start to have too many changes on the page to track.
    Then you just merge it all with ease.

### HTML Form Handler Attributes

The HTML Form Handler (HF) library utilizes custom attributes on HTML elements
to enable various functionalities and customize the behavior of form
submissions. These attributes are designed to provide flexibility and
extensibility to meet different use cases.

1. `hf`

- **Description:** HTMF is an opt-in library. You can use all of the normal form
attributes and just add the attribute `hf` to enable it. Using `hf-swap` or
`hf-target` will also enable the form.

2. `hf-ignore`

- **Description:** Prevents the associated form or submitter element from being
processed by the HTML Form Handler.
- **Usage:**
    - Add hf-ignore attribute to a form or submit button.

```html
<form hf-ignore>
  <!-- Form content -->
</form>

<button type="submit" hf-ignore>Submit</button>
```

3. `hf-target` or `target`

- **Description:** Specifies the target element for swapping content. The
  library will update the content of this element based on the server response.
  If you know that JS is enabled you can just use the `target` attribute instead.
- **Usage:**
    - Add hf-target attribute to a form or submit button.
    - The value is a query selector targeting the element where the content
      should be updated.

```html
<form hf-target="#result-container">
  <!-- Form content -->
</form>

<button type="submit" hf-target=".result">Submit</button>
```

4. `hf-swap`

- **Description:** Defines the type of content swapping to be performed. This
  attribute determines how the received HTML content should replace the target
  element.
- **Usage:**
    - Add `hf-swap` attribute to a form or submit button.
    - Possible values: `outerHTML`, `innerHTML`, `beforebegin`, `afterbegin`,
      `beforeend`, `afterend`, `none`.
    - Default is `outerHTML`. This can be overriden by placing the attribute in
      the body with the desired swap type.

```html
<form hf-swap="innerHTML">
  <!-- Form content -->
</form>

<button type="submit" hf-swap="append">Submit</button>
```

5. `hf-transition`

When placed on the body element it enables view transitions for all elements. It
can also be enabled for each swap by adding it to the submitter or form.  This
behavior can also be overridden in the options settings.

```html
<body hf-transition>
  ...
</body>
```

### Eventing

1. `hf:before`

- **Description:** A cancelable event called befoe fetch is called.
- **Usage:**
    - Subscribe to the `hf:before` event.

```javascript
doc.addEventListener("hf:before", e => {
  // Handle script-loaded event
});
```

2. `hf:after`

- **Description:** A cancelable event called befoe fetch is called.

3. `hf:swap`

- **Description:** A cancelable event called when the text content from the
fetched data is parsed and before the content is swapped.

3. `hf:swapped`

- **Description:** A cancelable event called after the content was swapped.

4. `hf:completed`

- **Description:** Called when no other operations will be performed.

### Headers Sent to the Server

The HTML Form Handler library sends a custom header to the server to help
identify AJAX requests and provide additional information.

```
HF-Request: true
```

- **Description:** This header is sent with each AJAX request initiated by the
  HTML Form Handler.
- **Purpose:** Identifies the request as originating from the HTML Form Handler,
  allowing the server to distinguish between regular and AJAX requests.

### Headers Sent to the Client

The HTML Form Handler library provides the ability to include custom headers in
the server's response, facilitating additional information or actions on the
client side.

### Special response status

When a response is given outside of a 200 response a special handler will be
treated for that response.

1. `204 No Content`
    - **Description:** This will do nothing. This is useful for sending a custom
      event with a response to the user, e.g., letting the user know the
      information was saved.
2. Redirected
    - **Description:** This will redirect the page to the specified response
      URL.

## Version

### 0.12.*

- Make view transitions opt-in

- Rewrite inspired by fixi.
  - Removed scrolling (put in separate package).
  - Removed script loading.
  - Removed some of the swap types.
  - Added `none` swap type.
  - Removed handling anything but HTML content type.

### 0.11.*

Removed constraint on only allowing POST and GET calls.
Added ability to cancel swap.
Added ability to opt-in with just an "hf" attribute.
Added ability to use a different swapping mechanism.

Ignore submissions which do not include one of the attributes `hf-target` or
`hf-select`.

### 0.10.*

In target allow value "this" to target the same element as the target.

Fix bugs from the change.

Prefer submitter over form for preventing repeat submissions before the previous
submission is completed. This allows for buttons to share a form and be
indepedent.

### 0.7.*

Fixed how a form reset is done.

Fixed event to match documented event naming.

Fixed `preventDefault` being called for `dialog` method.

Fixed bugs which occurred during the rewrite.

### 0.7.0

Substantial changes in this one. Fixed errors, use `getAttribute` to get the
attributes to avoid conflicts with form names. Fixed other errors. Standardized
event naming and attribute naming. Code clean up. Removed the JS Doc typing.
Changed how double click detection is handled. Fixed 205 response to reset form.

### 0.6.0

Add ability to handle scripts returned in the HTML snippets.

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
