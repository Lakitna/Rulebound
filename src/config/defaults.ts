import { LawbookConfig, ParsedLawConfig } from './types';

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

export const lawConfigDefault: ParsedLawConfig = {
    required: 'must',
    _name: '*',
    _specificity: 0,
    _throw: 'error',
};
