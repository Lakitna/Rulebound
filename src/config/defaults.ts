import { LawbookConfig } from './types';

export const lawbookConfigDefault: LawbookConfig = {
    verboseness: 'info',
    severity: {
        must: {
            level: 'error',
            description: true,
            input: true,
        },
        should: {
            level: 'warn',
            description: true,
            input: false,
        },
        may: {
            level: 'info',
            description: false,
            input: false,
        },
        optional: {
            level: 'info',
            description: false,
            input: false,
        },
    },
    laws: {},
    _laws: [],
};
