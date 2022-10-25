import { defaultsDeep } from 'lodash-es';
import micromatch from 'micromatch';

import { ConfigManager } from './config/manager';
import { RulebookConfig, RuleConfig } from './config/types';
import { RulebookError } from './errors';
import { logger, Logger } from './log';
import { Rule } from './rule';

/**
 * Collection to manage rules
 */
export class Rulebook {
    public config: ConfigManager;
    public rules: Rule[];
    private log: Logger;

    public constructor(config?: Partial<RulebookConfig>) {
        this.config = new ConfigManager(config);
        this.rules = [];

        this.log = logger.child({});
    }

    public get length() {
        return this.rules.length;
    }

    /**
     * Loop over the rules in the set
     */
    public forEach(
        function_: (value: Rule, index: number, array: Rule[]) => void,
        thisArgument?: any
    ) {
        for (const [index, rule] of this.rules.entries()) {
            function_.call(thisArgument, rule, index, this.rules);
        }
    }

    /**
     * Add a rule or create a new empty one
     * Sets configuration
     */
    public add(rule: string | Rule, defaultConfig?: Partial<RuleConfig>) {
        if (!(rule instanceof Rule)) {
            rule = new Rule(rule, this);
        }

        if (this.has(rule.name)) {
            throw new RulebookError(
                `The rule named '${rule.name}' already exists in the set.`,
                `Rule names must be unique.`
            );
        }

        let config = this.config.get(rule.name);
        if (defaultConfig) {
            config =
                config._specificity === 0
                    ? defaultsDeep(defaultConfig, config)
                    : defaultsDeep(config, defaultConfig);
        }
        rule.config = config;

        this.rules.push(rule);
        this.rules.sort((a, b) => {
            if (a.specificity > b.specificity) {
                return 1;
            }
            if (a.specificity < b.specificity) {
                return -1;
            }
            return 0;
        });

        return rule;
    }

    /**
     * Returns true if the set contains the given rule name pattern
     */
    public has(globPattern: string): boolean {
        const matcher = micromatch.matcher(globPattern);
        return this.rules.some((rule) => matcher(rule.name));
    }

    /**
     * Return rules matching filter in a new rule book
     * Opposite of omit()
     */
    public filter(globPattern: string): Rulebook {
        const matcher = micromatch.matcher(globPattern);

        const set = new Rulebook(this.config.full);
        for (const rule of this.rules) {
            if (matcher(rule.name)) {
                set.add(rule);
            }
        }
        return set;
    }

    /**
     * Return rules not matching filter in a new rule book
     * Opposite of filter()
     */
    public omit(globPattern: string) {
        return this.filter('!' + globPattern);
    }

    /**
     * Enforce all rules in the set
     */
    public async enforce(globPattern: string, ...input: any[]) {
        if (this.length === 0) {
            this.log.warn('No rules to enforce. Book is empty');
            return this;
        }

        const matcher = micromatch.matcher(globPattern);
        const subSet = this.rules.filter((rule) => matcher(rule.name));

        if (subSet.length === 0) {
            this.log.warn(`No rules to enforce for name pattern '${globPattern}'`);
            return this;
        }

        for (const rule of subSet) {
            await rule.enforce(...input);
        }

        return this;
    }
}
