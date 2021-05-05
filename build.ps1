
$htmf = Get-Content .\src\htmf-source.js
$htmf | esbuild.cmd --format=iife |
Tee-Object -FilePath .\public\htmf.js |
esbuild.cmd --minify > .\public\htmf.min.js

$extensions = Get-Content .\src\htmf-extensions-source.js
$extensions |
esbuild.cmd --format=iife |
Tee-Object -FilePath .\public\extensions.js |
esbuild.cmd --minify > .\public\extensions.min.js

$htmf + $extensions |
esbuild.cmd --format=iife |
Tee-Object -FilePath .\public\htmf-all.js |
esbuild.cmd --minify > .\public\htmf-all.min.js
