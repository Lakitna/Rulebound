import { defaultsDeep, omit, isUndefined } from 'lodash';
import * as micromatch from 'micromatch';
import isGlob from 'is-glob';
import cosmiconfig from 'cosmiconfig';

import { logger, Logger } from '../log';
import { lawbookConfigDefault, lawConfigDefault } from './defaults';
import { LawbookConfig, LawConfig, ParsedLawbookConfig, ParsedLawConfig } from './types';
import { specificity } from '../utils';


/**
 * Configuration handling
 */
export class ConfigManager {
    public config: ParsedLawbookConfig;
    private log: Logger;

    public constructor(config?: LawbookConfig) {
        const configFile = cosmiconfig('lawful').searchSync();

        config = defaultsDeep(config,
            (configFile === null) ? {} : configFile.config,
            lawbookConfigDefault) as LawbookConfig;

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
        let config = lawConfigDefault;

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
    public parse(config: LawbookConfig): ParsedLawbookConfig {
        const parsedConfig = config as ParsedLawbookConfig;
        parsedConfig._laws = parsedConfig._laws || [];

        if (Object.keys(config.laws).length === 0) {
            // There is nothing to parse
            return parsedConfig;
        }

        this.log.debug('Unparsed configuration found. Parsing...');

        // Map from `laws` to `_laws`
        Object.entries(parsedConfig.laws)
            .map((law) => {
                law[1]._name = law[0];
                return law[1];
            })
            .forEach((law) => {
                const existingIndex = parsedConfig._laws.findIndex((l) => {
                    return l._name === law._name;
                });

                if (existingIndex >= 0) {
                    // Update existing law config
                    parsedConfig._laws[existingIndex] =
                        defaultsDeep(law, parsedConfig._laws[existingIndex]);
                }
                else {
                    // Add new law config
                    parsedConfig._laws.push(law as ParsedLawConfig);
                }
            });

        // Config cascading by specificity
        parsedConfig._laws = this._sortBySpecificity(parsedConfig._laws, '_name');
        parsedConfig._laws.forEach((sourceLaw, sourceI, laws) => {
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

        parsedConfig.laws = {};
        return parsedConfig;
    }

    /**
     * Sort a list of objects by the specificity of the provided key
     */
    private _sortBySpecificity(targets: LawConfig[], patternKey: string) {
        const parsedTargets = targets as ParsedLawConfig[];

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
}
