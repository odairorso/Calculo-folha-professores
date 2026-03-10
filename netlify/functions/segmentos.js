import { wrap } from './_adapter.js';
import vercelHandler from '../../api/segmentos.js';

export const handler = wrap(vercelHandler);
