export function routeHandler(url) {
  return url.pathname.endsWith("/demo/")
      ? htmlResponse("<div>Foo</div>")
    : url.pathname.endsWith("/demo2/")
      ? htmlResponse("<button form=get formaction='/demo'>Button 2</button>")
    : url.pathname.endsWith("/demo3/")
      ? htmlResponse("content <button form=get formaction='/demo'>Button 2</button> content")
    : url.pathname.endsWith("/demo4/")
      ? htmlResponse("<p><button form=get formaction='/demo'>Button 2</button></p>")
    : null
}

function htmlResponse(str) {
  return new Response(str, {
    headers: {
      "Content-Type": "text/html",
    }
  })
}
