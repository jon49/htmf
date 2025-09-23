#!/bin/bash

rm -rf ./docs
rm -rf ./public

npx esbuild ./src/html-form.js --format=iife --outdir=public
npx esbuild ./public/html-form.js --minify --outfile=public/html-form.min.js

mkdir docs
cp ./public/html-form.js ./docs/html-form.js
cp -r ./static/* ./docs
cp -r ./node_modules/html-form-test-suite/test-files/* ./docs
