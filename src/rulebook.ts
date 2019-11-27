import micromatch from 'micromatch';
import { defaultsDeep } from 'lodash';

import { ConfigManager } from './config/manager';
import { Rule } from './rule';
import { logger, Logger } from './log';
import { RulebookConfig, RuleConfig } from './config/types';
import { RulebookError } from './errors';


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
    public forEach(fn: (value: Rule, index: number, array: Rule[]) => void, thisArgument?: any) {
        this.rules.forEach(fn, thisArgument);
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
                `Rule names must be unique.`);
        }

        let config = this.config.get(rule.name);
        if (defaultConfig) {
            if (config._specificity === 0) {
                config = defaultsDeep(defaultConfig, config);
            }
            else {
                config = defaultsDeep(config, defaultConfig);
            }
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
    public has(globPattern: string) {
        const matcher = micromatch.matcher(globPattern);

        let has = false;
        this.forEach((rule) => {
            if (matcher(rule.name)) {
                has = true;
            }
        });
        return has;
    }

    /**
     * Return rules matching filter in a new rule book
     * Opposite of omit()
     * @return new Rulebook
     */
    public filter(globPattern: string) {
        const matcher = micromatch.matcher(globPattern);

        const set = new Rulebook(this.config.full);
        this.forEach((rule) => {
            if (matcher(rule.name)) {
                set.add(rule);
            }
        });
        return set;
    }

    /**
     * Return rules not matching filter in a new rule book
     * Opposite of filter()
     * @return new Rulebook
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
        const subSet = this.rules
            .filter((rule) => matcher(rule.name));

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

export default Rulebook;
