#!/usr/bin/env nu

let htmf = (open ./src/htmf-source.js)
let iife = ($htmf | ^npx esbuild --format=iife)

$iife | save -f ./public/htmf.js
$iife | ^npx esbuild --minify | save -f ./public/htmf.min.js

