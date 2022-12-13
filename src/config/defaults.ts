import { ParsedRuleConfig, RulebookConfig } from './types';

export const rulebookConfigDefault: RulebookConfig = {
    verboseness: 'info',
    severity: {
        must: 'error',
        should: 'warn',
        may: 'info',
        optional: 'info',
    },
    enforceParallel: false,
    rules: {},
};

export const ruleConfigDefault: ParsedRuleConfig = {
    required: 'must',
    _name: '*',
    _specificity: 0,
    _throw: 'error',
};
