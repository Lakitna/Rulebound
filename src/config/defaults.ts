import { LawbookConfig } from './types';

export const lawbookConfigDefault: LawbookConfig = {
    verboseness: 'info',
    severity: {
        must: 'error',
        should: 'warn',
        may: 'info',
        optional: 'info',
    },
    laws: {},
};
