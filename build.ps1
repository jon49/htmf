
$htmf = Get-Content .\src\htmf-source.js
$htmf | esbuild.cmd --format=iife |
Tee-Object -FilePath .\public\htmf.js |
esbuild.cmd --minify > .\public\htmf.min.js
