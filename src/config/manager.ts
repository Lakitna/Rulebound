import isGlob from 'is-glob';
import { cloneDeep, defaultsDeep, omit, omitBy } from 'lodash-es';
import micromatch from 'micromatch';

import { globSpecificity, sortByGlobSpecificity } from 'glob-specificity';
import { Logger, logger } from '../log';
import { ruleConfigDefault, rulebookConfigDefault } from './defaults';
import { ParsedRuleConfig, ParsedRulebookConfig, RulebookConfig } from './types';

/**
 * Configuration handling
 */
export class ConfigManager {
    public config: ParsedRulebookConfig;
    private log: Logger;

    public constructor(partialConfig?: Partial<RulebookConfig>) {
        const config = defaultsDeep(
            cloneDeep(partialConfig),
            cloneDeep(rulebookConfigDefault)
        ) as RulebookConfig;

        logger.level = config.verboseness;
        this.log = logger.child({});

        this.config = this.parse(config);
    }

    public get full() {
        return omitBy(this.config, (_value, key) => {
            return key.startsWith('_');
        });
    }

    public get rules() {
        return this.config._rules;
    }

    public get generic(): Omit<RulebookConfig, '_rules' | 'rules'> {
        return omit(this.config, ['_rules', 'rules']);
    }

    public set(config: Partial<RulebookConfig>) {
        config = defaultsDeep(config, this.config);
        this.config = this.parse(config as RulebookConfig);
    }

    /**
     * Find the most specific config for a rule
     */
    public get(ruleName: string) {
        let config = ruleConfigDefault;

        for (const ruleConfig of this.config._rules) {
            if (
                micromatch.isMatch(ruleName, ruleConfig._name) &&
                config._specificity.compareTo(ruleConfig._specificity) === -1
            ) {
                config = ruleConfig;
            }
        }

        return cloneDeep(config);
    }

    /**
     * Apply config cascading based on rule name specificity
     */
    public parse(config: RulebookConfig): ParsedRulebookConfig {
        const parsedConfig = config as ParsedRulebookConfig;
        parsedConfig._rules = parsedConfig._rules || [];

        if (Object.keys(config.rules).length === 0) {
            // There is nothing to parse
            return parsedConfig;
        }

        this.log.debug('Unparsed configuration found. Parsing...');

        // Map from `rules` to `_rules`
        Object.entries(parsedConfig.rules)
            .map((rule) => {
                rule[1]._name = rule[0];
                rule[1]._specificity = globSpecificity(rule[0]);
                return rule[1];
            })
            // eslint-disable-next-line unicorn/no-array-for-each
            .forEach((rule) => {
                const existingIndex = parsedConfig._rules.findIndex((l) => {
                    return l._name === rule._name;
                });

                if (existingIndex >= 0) {
                    // Update existing rule config
                    parsedConfig._rules[existingIndex] = defaultsDeep(
                        rule,
                        parsedConfig._rules[existingIndex]
                    );
                } else {
                    // Add new rule config
                    parsedConfig._rules.push(rule as ParsedRuleConfig);
                }
            });

        // Config cascading by specificity
        parsedConfig._rules = this._sortBySpecificity(parsedConfig._rules);
        // eslint-disable-next-line unicorn/no-array-for-each
        parsedConfig._rules.forEach((sourceRule, sourceI, rules) => {
            if (!isGlob(sourceRule._name)) {
                return;
            }

            // Source rule config will act as defaults for
            // more specific target rules matching the name pattern
            for (let targetI = sourceI; targetI < rules.length; targetI++) {
                let targetRule = rules[targetI];
                if (
                    micromatch.isMatch(targetRule._name, sourceRule._name) &&
                    targetRule._specificity.compareTo(sourceRule._specificity) === 1
                ) {
                    targetRule = defaultsDeep(targetRule, sourceRule);
                }
            }
        });

        parsedConfig.rules = {};
        return parsedConfig;
    }

    /**
     * Sort a list of objects by the specificity of the provided key
     */
    private _sortBySpecificity(parsedTargets: ParsedRuleConfig[]) {
        const specificities = parsedTargets.map((target) => {
            return {
                specificity: target._specificity,
                glob: target._name,
                target: target,
            };
        });
        return sortByGlobSpecificity(specificities).map((sorted) => sorted.target);
    }
}
