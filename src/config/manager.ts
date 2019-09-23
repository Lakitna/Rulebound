import { defaultsDeep, omit, isUndefined, isObject } from 'lodash';
import * as micromatch from 'micromatch';
import isGlob from 'is-glob';

import { logger, Logger } from '../log';
import { lawbookConfigDefault } from './defaults';
import { LawbookConfig, LawConfig } from './types';
import { specificity } from '../utils';


/**
 * Configuration handling
 */
export class ConfigManager {
    public config: LawbookConfig;
    private log: Logger;

    public constructor(config?: LawbookConfig) {
        config = defaultsDeep(config, lawbookConfigDefault) as LawbookConfig;

        logger.level = config.verboseness;
        this.log = logger.child({});

        this.config = this.parse(config);
    }

    public get full() {
        return this.config;
    }

    public get laws() {
        return this.config._laws;
    }

    public get generic() {
        return omit(this.config, ['_laws', 'laws']);
    }

    public set(config: LawbookConfig) {
        config = defaultsDeep(config, this.config);
        this.config = this.parse(config);
    }

    /**
     * Find the most specific config for a law
     */
    public get(lawName: string) {
        let config: Partial<LawConfig> = {
            _name: '*',
            _specificity: 0,
        };

        this.config._laws.forEach((lawConfig) => {
            if (micromatch.isMatch(lawName, lawConfig._name)
                    && !isUndefined(config._specificity)
                    && config._specificity < lawConfig._specificity) {
                config = lawConfig;
            }
        });

        return config;
    }

    /**
     * Apply config cascading based on law name specificity
     */
    public parse(config: LawbookConfig) {
        if (Object.keys(config.laws).length === 0) {
            // There is nothing to parse
            return config;
        }

        this.log.debug('Unparsed configuration found. Parsing...');

        this._parseSeverity(config);

        // Map from `laws` to `_laws`
        Object.entries(config.laws)
            .map((law) => {
                law[1]._name = law[0];
                return law[1];
            })
            .forEach((law) => {
                const existingIndex = config._laws.findIndex((l) => {
                    return l._name === law._name;
                });

                if (existingIndex >= 0) {
                    // Update existing law config
                    config._laws[existingIndex] =
                        defaultsDeep(law, config._laws[existingIndex]);
                }
                else {
                    // Add new law config
                    config._laws.push(law);
                }
            });

        // Config cascading by specificity
        config._laws = this._sortBySpecificity(config._laws, '_name');
        config._laws.forEach((sourceLaw, sourceI, laws) => {
            if (isGlob(sourceLaw._name)) {
                // Source law config will act as defaults for
                // more specific target laws matching the name pattern
                for (let targetI = sourceI; targetI < laws.length; targetI++) {
                    let targetLaw = laws[targetI];
                    if (micromatch.isMatch(targetLaw._name!, sourceLaw._name!)
                            && targetLaw._specificity! > sourceLaw._specificity!) {
                        targetLaw = defaultsDeep(targetLaw, sourceLaw);
                    }
                }
            }
        });

        config.laws = {};
        return config;
    }

    /**
     * Sort a list of objects by the specificity of the provided key
     * @private
     */
    private _sortBySpecificity(targets: LawConfig[], patternKey: string) {
        const sorted: LawConfig[] = [];

        targets.forEach((target) => {
            target._specificity = specificity(target[patternKey]);
            sorted.push(target);
        });

        return sorted
            .sort((a, b) => a._specificity! - b._specificity!);
    }


    /**
     * Allow severity levels to be specified as both strings and objects
     */
    private _parseSeverity(config: LawbookConfig) {
        for (const level in config.severity) {
            if (isObject(config.severity[level])) {
                continue;
            }

            const object = {
                level: config.severity[level],
            };
            config.severity[level] = defaultsDeep(object, lawbookConfigDefault.severity[level]);
        }
    }
}
