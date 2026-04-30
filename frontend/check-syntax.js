const parser = require('@babel/parser');
const fs = require('fs');

function check(file, plugins) {
  try {
    parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins });
    console.log(file + ' (' + plugins.join(',') + '): OK');
  } catch (e) {
    console.log(file + ' (' + plugins.join(',') + ') ERROR at line ' + e.loc?.line + ', col ' + e.loc?.column + ': ' + e.message);
  }
}

check('src/pages/home.jsx', ['jsx']);
check('src/pages/home.jsx', ['jsx', 'flow']);
check('src/pages/history.jsx', ['jsx']);
check('src/pages/history.jsx', ['jsx', 'flow']);

