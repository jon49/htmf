
$htmf = Get-Content .\htmf-source.js
$htmf | esbuild.cmd --format=iife |
Tee-Object -FilePath htmf.js |
esbuild.cmd --minify > htmf.min.js

$extensions = Get-Content .\htmf-extensions-source.js
$extensions |
esbuild.cmd --format=iife |
Tee-Object -FilePath extensions.js |
esbuild.cmd --minify > extensions.min.js

$htmf + $extensions |
esbuild.cmd --format=iife |
Tee-Object -FilePath htmf-all.js |
esbuild.cmd --minify > htmf-all.min.js
