import { logLevelNames } from '../log';

export interface RuleConfig {
    [config: string]: any;

    /**
     * Define the required of the rule.
     * note: `omit` will always result in the rule not being enforced
     * @default must
     */
    required: 'must' | 'should' | 'may' | 'optional' | 'omit';
}

export interface ParsedRuleConfig extends RuleConfig {
    /**
     * Define the behaviour of a failure.
     * @private
     */
    _throw?: severityLevel;

    /**
     * @private
     */
    _name: string;

    /**
     * Specificity level used to cascase configurations
     * @private
     */
    _specificity: number;
}

export type severityLevel = 'error' | 'warn' | 'info' | null;

export interface RulebookConfig {
    /**
     * Define what log level you want to output
     */
    verboseness: logLevelNames;

    /**
     * Describe the effect a failure has in a given severity category
     */
    severity: {
        /**
         * @default error
         */
        must: severityLevel;

        /**
         * @default warn
         */
        should: severityLevel;

        /**
         * @default info
         */
        may: severityLevel;

        /**
         * @default info
         */
        optional: severityLevel;
    };

    /**
     * List of rule configurations
     */
    rules: {
        [ruleName: string]: RuleConfig;
    };
}

export interface ParsedRulebookConfig extends RulebookConfig {
    /**
     * @private
     * List of rules and their parsed configurations.
     */
    _rules: ParsedRuleConfig[];
}
