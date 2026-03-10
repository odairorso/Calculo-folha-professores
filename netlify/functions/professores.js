const { wrap } = require('./_adapter');
const vercelHandler = require('../../api/professores.js');

exports.handler = wrap(vercelHandler);

