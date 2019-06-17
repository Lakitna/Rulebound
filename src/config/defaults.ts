import { LawbookConfig } from './types';

export const lawbookConfigDefault: LawbookConfig = {
    verboseness: 'log',
    severity: {
        must: 'error',
        should: 'warn',
        may: 'log',
        optional: 'log',
    },
    laws: {},
    _laws: [],
};
