import { cloneDeep, defaultsDeep, omit, omitBy, isUndefined, isNull } from 'lodash';
import micromatch from 'micromatch';
import isGlob from 'is-glob';
import { cosmiconfigSync } from 'cosmiconfig';

import { logger, Logger } from '../log';
import { rulebookConfigDefault, ruleConfigDefault } from './defaults';
import { RulebookConfig, RuleConfig, ParsedRulebookConfig, ParsedRuleConfig } from './types';
import { specificity } from '../utils';


/**
 * Configuration handling
 */
export class ConfigManager {
    public config: ParsedRulebookConfig;
    private log: Logger;

    public constructor(partialConfig?: Partial<RulebookConfig>) {
        const config = this._resolveConfigFile(partialConfig);

        logger.level = config.verboseness;
        this.log = logger.child({});

        this.config = this.parse(config);
    }

    public get full() {
        return omitBy(this.config, (value, key) => {
            return key.startsWith('_');
        });
    }

    public get rules() {
        return this.config._rules;
    }

    public get generic() {
        return omit(this.config, ['_rules', 'rules']);
    }

    public set(config: RulebookConfig) {
        config = defaultsDeep(config, this.config);
        this.config = this.parse(config);
    }

    /**
     * Find the most specific config for a rule
     */
    public get(ruleName: string) {
        let config = ruleConfigDefault;

        this.config._rules.forEach((ruleConfig) => {
            if (micromatch.isMatch(ruleName, ruleConfig._name)
                    && !isUndefined(config._specificity)
                    && config._specificity < ruleConfig._specificity) {
                config = ruleConfig;
            }
        });

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
                return rule[1];
            })
            .forEach((rule) => {
                const existingIndex = parsedConfig._rules.findIndex((r) => {
                    return r._name === rule._name;
                });

                if (existingIndex >= 0) {
                    // Update existing rule config
                    parsedConfig._rules[existingIndex] =
                        defaultsDeep(rule, parsedConfig._rules[existingIndex]);
                }
                else {
                    // Add new rule config
                    parsedConfig._rules.push(rule as ParsedRuleConfig);
                }
            });

        // Config cascading by specificity
        parsedConfig._rules = this._sortBySpecificity(parsedConfig._rules, '_name');
        parsedConfig._rules.forEach((sourceRule, sourceI, rules) => {
            if (isGlob(sourceRule._name)) {
                // Source rule config will act as defaults for
                // more specific target rules matching the name pattern
                for (let targetI = sourceI; targetI < rules.length; targetI++) {
                    let targetRule = rules[targetI];
                    if (micromatch.isMatch(targetRule._name!, sourceRule._name!)
                            && targetRule._specificity! > sourceRule._specificity!) {
                        targetRule = defaultsDeep(targetRule, sourceRule);
                    }
                }
            }
        });

        parsedConfig.rules = {};
        return parsedConfig;
    }

    /**
     * Sort a list of objects by the specificity of the provided key
     */
    private _sortBySpecificity(targets: RuleConfig[], patternKey: string) {
        const parsedTargets = targets as ParsedRuleConfig[];

        parsedTargets.map((target) => {
            target._specificity = specificity(target[patternKey]);
            return target;
        });

        return parsedTargets
            .sort((a, b) => {
                if (a._specificity > b._specificity) {
                    return 1;
                }
                if (a._specificity < b._specificity) {
                    return -1;
                }
                return 0;
            });
    }

    /**
     * Resolve full config using all sources
     */
    private _resolveConfigFile(partialConfig?: Partial<RulebookConfig>) {
        let configFile = cosmiconfigSync('rulebound').search();
        if (isNull(configFile)) {
            configFile = {
                filepath: '',
                config: {},
            };
        }

        return defaultsDeep(
            cloneDeep(partialConfig),
            cloneDeep(configFile.config),
            cloneDeep(rulebookConfigDefault)
        ) as RulebookConfig;
    }
}
