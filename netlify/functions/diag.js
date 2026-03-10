import { wrap } from './_adapter.js';
import vercelHandler from '../../api/diag.js';

export const handler = wrap(vercelHandler);
