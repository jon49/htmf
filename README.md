# HTML Form Handler

`html-form` (htmf) is a minimalist library similar to HTMX and other
technologies (Behavior.js (RIP), unpoly, etc.) designed to work directly with
forms. It has a minimal API. It also makes it easy to build Multipage apps (MPA)
which works without JavaScript and the JS is just progressive enhancement.

I have successfully created offline-first applications with this library. I have
also successfully used it to create an offline-first, SPA, PWA application.

`htmf` is 4.1 kB minified and 2.2 kB minified and zipped.

A Todo MVC example [can be found here](https://jon49.github.io/htmf/todo/#).

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
4. Script Execution:
    - Handles script execution within the received HTML content to ensure proper
      functionality.
5. Scroll Management:
    - Manages scroll positions before and after form submissions to provide a
      seamless user experience.
6. Event-Based Customization:
    - Allows customization of various events like "hf:request-before,"
      "hf:request-after," "hf:json," "hf:swap," and more.

## Installation

Copy the file from the source code `public/html-form.js` or the minified version
`public/html-form.min.js`.

Or use `npm` `npm i html-form` and reference it like so `import "html-form"`.

## Usage

### HTML Form Handler Attributes

The HTML Form Handler (HF) library utilizes custom attributes on HTML elements
to enable various functionalities and customize the behavior of form
submissions. These attributes are designed to provide flexibility and
extensibility to meet different use cases.

1. `hf-ignore`

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

2. `hf-target`

- **Description:** Specifies the target element for swapping content. The
  library will update the content of this element based on the server response.
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

3. `hf-swap`

- **Description:** Defines the type of content swapping to be performed. This
  attribute determines how the received HTML content should replace the target
  element.
- **Usage:**
    - Add `hf-swap` attribute to a form or submit button.
    - Possible values: `outerHTML`, `innerHTML`, `append`, `prepend`,
      `beforebegin`, `afterbegin`, `beforeend`, `afterend`, `oob`.

```html
<form hf-swap="innerHTML">
  <!-- Form content -->
</form>

<button type="submit" hf-swap="append">Submit</button>
```

4. `hf-select`

- **Description:** Specifies a query selector all for selecting specific
  elements within the received HTML content to replace existing elements.
- **Usage:**
    - Add `hf-select` attribute to a form or submit button.

```html
<form hf-select=".select-container,#other-item">
  <!-- Form content -->
</form>

<button type="submit" hf-select=".select-container,#other-item">Submit</button>
```

5. `hf-scroll-ignore`

- **Description:** Prevents automatic scrolling after a form submission.
- **Usage:**
    - Add `hf-scroll-ignore` attribute to a form or submit button.

```html
<form hf-scroll-ignore>
  <!-- Form content -->
</form>

<button type="submit" hf-scroll-ignore>Submit</button>
```

6. `hf-scroll-to`

- **Description:** Specifies the element to which the page should scroll after a
  form submission.
- **Usage:**
    - Add `hf-scroll-to` attribute to a form or submit button.
    - The value is a query selector targeting the element to scroll to.

```html
<form hf-scroll-to="#result-section">
  <!-- Form content -->
</form>

<button type="submit" hf-scroll-to=".result-section">Submit</button>
```

7. `hf-scroll-skip`

- **Description:** Skips scrolling entirely after a form submission.
- **Usage:**
    - Add hf-scroll-skip attribute to the body element.

```html
<body hf-scroll-skip>
  <!-- Page content -->
</body>
```

8. `hf-focus-skip`

- **Description:** Skips focusing on elements after a form submission.
- **Usage:**
    - Add `hf-focus-skip` attribute to form elements.

```html
<form hf-focus-skip>
  <!-- Form content -->
</form>
```

### Eventing

9. `hf:script-loaded`

- **Description:** An event triggered after a script is successfully loaded.
- **Usage:**
    - Subscribe to the `hf:script-loaded` event.

```javascript
doc.addEventListener("hf:script-loaded", e => {
  // Handle script-loaded event
});
```

10. `hf:request-before`, `hf:request-after`, `hf:json`, `hf:swap`,
    `hf:response-error`, `hf:completed`

- **Description:** Events triggered at different stages of the form submission
  process.
- **Usage:**
    - Subscribe to these events for customization.

```javascript
doc.addEventListener("hf:json", e => {
  // Handle JSON response event
});

doc.addEventListener("hf:swap", e => {
  // Handle content swap event
});

// ... and so on
```

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

#### `hf-events`

- **Description:** A custom header included in the server's response to specify
  events to be triggered on the client side.
- **Format:** JSON format containing event names as keys and corresponding event
  details as values.

**Example:**

```css
hf-events: {"eventName1": {"detail1": "value1"}, "eventName2": {"detail2": "value2"}}
```

### Special response status

When a response is given outside of a 200 response a special handler will be
treated for that response.

1. `200 OK`
    - **Description:** Indicates a successful response.
    - **Handling:** The library processes the response based on its content
      type.
        - If the content type is JSON (application/json), it triggers the
          `hf:json` event with the parsed JSON data.
        - If the content type is HTML (text/html), it triggers the `hf:swap`
          event with the received HTML content.
        - For other content types, the library does not perform additional
          handling.
2. `204 No Content`
    - **Description:** This will do nothing. This is useful for sending a custom
      event with a response to the user, e.g., letting the user know the
      information was saved.
3. `205 Reset Content`
    - **Description:** This will reset the content in the form. You can also
      send back events to go along with this.
4. Redirected
    - **Description:** This will redirect the page to the specified response
      URL.

## Version

### 0.7.3

Fixed event to match documented event naming.

### 0.7.1

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
