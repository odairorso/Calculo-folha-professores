const { wrap } = require('./_adapter');
const vercelHandler = require('../../api/diag.js');

exports.handler = wrap(vercelHandler);

