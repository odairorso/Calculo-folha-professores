import { wrap } from './_adapter.js';
import vercelHandler from '../../api/professores.js';

export const handler = wrap(vercelHandler);
