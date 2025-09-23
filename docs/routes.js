export function routeHandler(url) {
  switch(url.pathname) {
    case "/demo/":
      return htmlResponse("<div>Foo</div>")
    case "/demo2/":
      return htmlResponse("<button form=get formaction='/demo'>Button 2</button>")
    case "/demo3/":
      return htmlResponse("content <button form=get formaction='/demo'>Button 2</button> content")
    case "/demo4/":
      return htmlResponse("<p><button form=get formaction='/demo'>Button 2</button></p>")
  }
}

function htmlResponse(str) {
  return new Response(str, {
    headers: {
      "Content-Type": "text/html",
    }
  })
}
