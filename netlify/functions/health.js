import { wrap } from './_adapter.js';
import vercelHandler from '../../api/health.js';

export const handler = wrap(vercelHandler);
