const fs = require('fs');

// Leer el archivo
let content = fs.readFileSync('App.tsx', 'utf8');

// Reemplazar la línea problemática
content = content.replace(
  /className={`w-full text-left flex items-center p-2 lg:p-3 rounded-lg lg:rounded-xl text-sm transition-all duration-200 min-h-\[48px\] lg:min-h-\[56px\] \$\{/g,
  'className={`w-full text-left flex items-center p-2 lg:p-3 rounded-lg lg:rounded-xl text-sm transition-all duration-200 min-h-[48px] lg:min-h-[56px] ${'
);

// Escribir el archivo corregido
fs.writeFileSync('App.tsx', content);

console.log('Archivo corregido');
