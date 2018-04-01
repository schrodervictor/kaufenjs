console.log('Test suite bootstrap:');

global.chai = require('chai');
global.expect = chai.expect;
console.log('  - chai and expect available globally');

chai.use(require('sinon-chai'));
console.log('  - chai configured to use sinon');

global.sinon = require('sinon');
global.spy = sinon.spy;
console.log('  - sinon and spy available globally');

global.rootRequire = (moduleName) => require('..' + moduleName);
console.log('  - rootRequire available globally');
