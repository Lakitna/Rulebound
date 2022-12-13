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
     * What log level you want to output to the console
     *
     * @default 'info'
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
     * Paralellize enforcing rules
     *
     * This can speed up enforcement when you have rules that use a lots of I/O.
     *
     * If `true`: All rules will be enforced asynchrounously without waiting on eachother. Order of
     * enforcing is not guaranteed in any way.
     *
     * If `false`: Each rule is enforced after the previous is done enforcing. Enforcing is done in
     * order of rule specificity (least specific to most specific).
     *
     * @default false
     */
    enforceParallel: boolean;

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
