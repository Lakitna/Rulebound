import { omitBy, defaultsDeep, keys, isError, has } from 'lodash';

import { logger, Logger } from './log';
import { LawError, ConfigError } from './errors';
import { LawConfig } from './config/types';
import { Lawbook } from './lawbook';
import { specificity } from './utils';


/**
 * A testing rule
 *
 * @example
 * new Law('foo')
 *     .describe(`
 *         An example law
 *     `)
 *     .define(function(val) {
 *         return val <= 5;
 *     })
 *     .punishment(function(val) {
 *         throw new Error(`${val} is above 5`);
 *     })
 *     .reward(function(val) {
 *         console.log(`${val} is below or equal to 5`);
 *     })
 *     .enforce(1);
 */
export class Law {
    public name: string;
    public description?: string;
    public specificity: number;
    public lawbook: Lawbook;
    private _alias: string | null;
    private _config: LawConfig;
    private log: Logger;
    private on: {
        enforce: (this: Law, ...input: any) => boolean|any;
        pass: (this: Law, input: any[]) => void;
        fail: (this: Law, input: any[], result: any|Error) => void;
    };

    public constructor(name: string, lawbook: Lawbook) {
        this.name = name;
        this._alias = null;
        this.lawbook = lawbook;
        this.specificity = specificity(name);

        this.log = logger.child({ law: name });

        this._config = {
            severity: 'must',
            _name: '*',
            _throw: 'error',
            _specificity: 0,
        };

        this.on = {
            // eslint-disable-next-line no-shadow-restricted-names
            enforce: function undefined() {
                throw new LawError(this, 'Law is undefined');
            },

            // eslint-disable-next-line no-shadow-restricted-names
            pass: function undefined() { return; },

            // eslint-disable-next-line no-shadow-restricted-names
            fail: function undefined(_, result) {
                this.throw(result);
            },
        };
    }

    /**
     * Get config, omitting keys that start with `_`
     */
    public get config() {
        return omitBy(this._config, (_, key) => {
            return key.startsWith('_');
        }) as Partial<LawConfig>;
    }

    /**
     * Set config while treating existing config as defaults
     */
    public set config(config: Partial<LawConfig>) {
        this._config = defaultsDeep(config, this._config);

        if (this._config.severity === null) {
            this._config._throw = null;
            return;
        }

        this._config.severity = this._config.severity!.toLowerCase() as LawConfig['severity'];

        if (this.lawbook.config) {
            const lawbookConfig = this.lawbook.config.generic;

            if (!has(lawbookConfig.severity, this._config.severity)) {
                throw new ConfigError(
                    `Found unkown severity '${this._config.severity}' in the`,
                    `configuration for law '${this.name}'. Expected one of`,
                    `['${keys(lawbookConfig.severity).join(`', '`)}', null]`);
            }

            this._config._throw = lawbookConfig.severity[this._config.severity];
        }
    }

    /**
     * Define the law logic.
     * Return `true` to reward, return anything else or throw an error
     * to punish. The returned value is passed to the punishment as the
     * final argument.
     *
     * @example
     * Law.define(function(val) {
     *     return val > 5;
     * });
     */
    public define(fn: (...input: any) => boolean|any) {
        this.log.debug(`Law defined`);

        Object.defineProperty(fn, 'name', { value: 'definition' });

        this.on.enforce = fn;

        return this;
    }

    /**
     * Define what will happen if the law fails
     *
     * @example
     * Law.punishment(function(input) {
     *     throw new Error(`Law failed. Input: ${input}`)
     * });
     *
     * @example The final argument is the result of the definition
     * Law.punishment(function(input, result) {
     *     this.throw(`Enforcing resulted in ${result}`);
     * });
     */
    public punishment(fn: (input: any, err: any) => void) {
        this.log.debug(`Punishment defined`);

        Object.defineProperty(fn, 'name', { value: 'punishment' });

        this.on.fail = fn;

        return this;
    }

    /**
     * Define what will happen if the law passes.
     *
     * @example
     * Law.reward(function(val) {
     *     console.log('Yay! The law is uphold. Let\'s party!');
     * });
     */
    public reward(fn: (input: any[]) => void) {
        this.log.debug(`Reward defined`);

        Object.defineProperty(fn, 'name', { value: 'reward' });

        this.on.pass = fn;

        return this;
    }


    /**
     * Provide a human readable description of the law.
     *
     * @example
     * Law.describe(`
     *     Look at this amazing description!
     * `);
     */
    public describe(description: string) {
        this.description = description
            .trim()
            // Get rid of whitespace at the start of each line
            .replace(/^[^\S\n]+/gm, '');

        return this;
    }


    /**
     * When enforcing use another law(s) under the namespace of the current law.
     * Any errors will be thrown under the currents laws name with the currents
     * law severity level.
     *
     * @example
     * Law.alias('another/law')
     *
     * @example
     * Law.alias('another/*')
     */
    public alias(globPattern: string) {
        // Ideally we would check for the existence of the aliased law
        // here, but at this point not all laws have been defined yet.
        // Instead we'll check as a part of `.enforce()`
        this.log.debug(`Set alias ${globPattern}`);
        this._alias = globPattern;
        return this;
    }


    /**
     * Enforce a law.
     *
     * @example
     * Law.enforce('foo');
     *
     * @example
     * Law.enforce('foo', 'bar', 1, 86, 9302);
     */
    public async enforce(...input: any) {
        if (this._config._throw === null && !this._config._asAlias) {
            // Skip law
            return this;
        }

        this.log.debug(`Enforcing`);

        let result = null;
        if (this._alias !== null) {
            try {
                await this.enforceAlias(this._alias, input);

                // The aliased law did not throw. Stop enforcing now to prevent
                // doing things twice. This also means that the current law will
                // not reward.
                return this;
            }
            catch (error) {
                result = error;
            }
        }
        else {
            try {
                result = await this.on.enforce.call(this, ...input);
            }
            catch (error) {
                result = error;
            }
        }

        this.handleEnforceResult(input, result);
        return this;
    }

    /**
     * Throw an error or log a warning for this law.
     * Severity decides if it'll throw or log at witch level.
     *
     * @example
     * Law.throw('An error has occured');
     */
    public throw(...message: string[]) {
        this.log.debug(`Throwing error`);

        message = message.map((partialMessage: any) => {
            if (isError(partialMessage)) {
                return partialMessage.message;
            }
            return partialMessage;
        });

        const lawError = new LawError(this, ...message);

        // Always throw when called as an aliased law so we can handle the
        // error in the alias.
        if (this._config._throw === 'error' || this._config._asAlias) {
            throw lawError;
        }
        if (this._config._throw === 'warn') {
            this.log.warn(lawError.toString());
            return;
        }
        if (this._config._throw === 'info') {
            this.log.info(lawError.toString());
            return;
        }
    }


    /**
     * Enforce by the definition of another law
     */
    private async enforceAlias(aliasName: string, input: any[]) {
        this.log.debug(`Enforcing via alias ${this._alias}`);

        if (!this.lawbook.has(aliasName)) {
            throw new Error(`Could not find alias named '${aliasName}'`);
        }

        const aliased = this.lawbook.filter(aliasName);
        aliased.forEach((law) => {
            // Tell the law it's being enforced as an alias
            law.config = { _asAlias: true };

            // We are not copying the config of the current law to the alias.
            // We may want to add that at some point, but I quite frankly don't
            // see why it's worth the effort.
        });

        try {
            await aliased.enforce(aliasName, ...input);
            this.log.debug('Alias passed');
        }
        catch (error) {
            this.log.debug(`Alias threw error. Punishing in own name`);
            this.description = error.law.description;
            throw new Error(error._message);
        }
        finally {
            aliased.forEach((law) => {
                law.config = { _asAlias: false };
            });
        }
    }

    /**
     * Determine what to do with the enforce results
     */
    private handleEnforceResult(input: any[], result: any) {
        if (result === true) {
            this.log.debug(`Law passed. Rewarding`);

            try {
                this.on.pass.call(this, input);
            }
            catch (error) {
                if (error instanceof LawError) {
                    throw error;
                }
                this.throw(error.message);
            }
        }
        else {
            this.log.debug(`Law failed. Punishing`);

            try {
                this.on.fail.call(this, input, result);
            }
            catch (error) {
                if (error instanceof LawError) {
                    throw error;
                }
                this.throw(error.message);
            }
        }
    }
}
