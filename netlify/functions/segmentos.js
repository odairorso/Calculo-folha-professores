const { wrap } = require('./_adapter');
const vercelHandler = require('../../api/segmentos.js');

exports.handler = wrap(vercelHandler);

