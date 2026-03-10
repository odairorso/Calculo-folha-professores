const { wrap } = require('./_adapter');
const vercelHandler = require('../../api/health.js');

exports.handler = wrap(vercelHandler);

