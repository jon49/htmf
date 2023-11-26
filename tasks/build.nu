#!/usr/bin/env nu

let htmf = (open ./src/html-form.js)
let iife = ($htmf | ^npx esbuild --format=iife)

$iife | save -f ./public/html-form.js
$iife | ^npx esbuild --minify | save -f ./public/html-form.min.js

