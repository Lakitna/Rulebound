export interface LawConfig {
    [config: string]: any;

    /**
     * Define the severity of the law.
     * note: `omit` will always result in the law not being enforced
     * @default must
     */
    severity: 'must'|'should'|'may'|'optional'|'omit';

    /**
     * Define the behaviour of a failure.
     * @private
     */
    _throw?: 'error'|'warn'|'info'|null;

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

export type severityLevel = 'error'|'warn'|'info'|null;

export interface LawbookConfig {
    /**
     * Define what log level you want to output
     * @default log
     */
    verboseness: 'error'|'warn'|'info'|'debug';

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
     * List of law configurations
     */
    laws: {
        [lawName: string]: LawConfig;
    };

    /**
     * @private
     * List of laws and their parsed configurations.
     */
    _laws: LawConfig[];
}
