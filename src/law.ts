import { omitBy, defaultsDeep, keys, isError, has, isString, isUndefined } from 'lodash';

import { logger, Logger } from './log';
import { LawError, ConfigError } from './errors';
import { LawConfig } from './config/types';
import { Lawbook } from './lawbook';
import { specificity } from './utils';
import { isFunction } from 'util';


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
    private handler: {
        enforce: { (this: Law, ...input: any): boolean|any }[];
        pass: { (this: Law, input: any[]): void }[];
        fail: { (this: Law, input: any[], result: any|Error): void }[];
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

        this.handler = {
            enforce: [
                // eslint-disable-next-line no-shadow-restricted-names
                function undefined() {
                    throw new LawError(this, [], 'Law is undefined');
                },
            ],
            pass: [
                // eslint-disable-next-line no-shadow-restricted-names
                function undefined() { return; },
            ],
            fail: [
                // eslint-disable-next-line no-shadow-restricted-names
                function undefined(_, result) {
                    if (isError(result)) {
                        throw result;
                    }
                    throw new Error(result);
                },
            ],
        }
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

            this._config._throw = lawbookConfig.severity[this._config.severity].level;
        }
    }


    /**
     * Subscribe to an event
     *
     * @example
     * Law.on('enforce', (val) => {
     *      return val > 5;
     * });
     *
     * @example
     * Law.on('fail', (val) => {
     *     throw new Error(`Law failed. Input: ${input}`)
     * });
     *
     * @example
     * Law.on('pass', (val) => {
     *     console.log('Yay! The law is uphold. Let\'s party!');
     * });
     */
    public on(event: 'enforce'|'fail'|'pass', fn: (this: Law, ...params: any) => any) {
        this.log.debug(`on event ${event} defined`);

        Object.defineProperty(fn, 'name', { value: event });

        if (event !== 'enforce' && event !== 'fail' && event !== 'pass') {
            throw new LawError(this, [],
                `You tried to subscribe to unkown event '${event}'`);
        }

        if (this.handler[event].length === 1) {
            // Filter out default handler functions
            // @ts-ignore
            this.handler[event] = this.handler[event].filter((fn) => {
                return !fn.name.startsWith('undefined');
            });
        }

        this.handler[event].push(fn);
        return this;
    }


    /**
     * Define the law logic.
     * Return `true` to reward, return anything else or throw an error
     * to punish.
     *
     * @example
     * Law.define(function(val) {
     *     return val > 5;
     * });
     */
    public define(fn: (...input: any) => boolean|any) {
        return this.on('enforce', fn);
    }


    /**
     * Define what will happen if the law fails.  The returned/thrown value is
     * passed as the final argument.
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
        return this.on('fail', fn);
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
        return this.on('pass', fn);
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
        if (isFunction(description)) {
            throw new LawError(this, [], `Description must be a string. `
                + `Did you mean to call '.define(fn)' instead?`);
        }

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
                result = [];
                for (const fn of this.handler.enforce) {
                    result.push(await fn.call(this, ...input));
                }
            }
            catch (error) {
                result = error;
            }
        }

        await this.handleEnforceResult(input, result);
        return this;
    }

    /**
     * Throw an error or log a warning for this law.
     * Severity decides if it'll throw or log at witch level.
     *
     * @example
     * Law.throw('An error has occured');
     */
    public throw(input: any, ...message: (any|Error)[]) {
        this.log.debug(`Throwing error`);

        message = message.map((partialMessage: any) => {
            if (isError(partialMessage)) {
                return partialMessage.message;
            }
            else if (isUndefined(partialMessage)) {
                return '';
            }
            else if (!isString(partialMessage)) {
                return partialMessage.toString();
            }
            return partialMessage;
        });

        const lawError = new LawError(this, input, ...message as string[]);

        // Always throw when called as an aliased law so we can handle the
        // error in the alias.
        if (this._config._throw === 'error' || this._config._asAlias) {
            // TODO: Find a way to log this in it's pretty form
            // this.log.error(lawError.toString());
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
            throw new LawError(this, input, `Could not find alias named '${aliasName}'`);
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
            this.description = error.description;
            throw new Error(error.message);
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
    private async handleEnforceResult(input: any[], results: any[]|Error) {
        let failResults = [];
        if (isError(results)) {
            failResults.push(results);
        }
        else {
            failResults = results.filter((r: any) => r !== true);
        }

        if (failResults.length === 0) {
            this.log.debug(`Law passed. Rewarding`);
            await this.raiseVoidEvent('pass', input);
        }
        else {
            this.log.debug(`Law failed. Punishing`);
            await this.raiseVoidEvent('fail', input, results);
        }
    }

    /**
     * Raise void event and handle any errors
     */
    private async raiseVoidEvent(event: string, ...parameters: any) {
        try {
            for (const fn of this.handler[event]) {
                await fn.call(this, ...parameters);
            }
        }
        catch (error) {
            if (error instanceof LawError) {
                throw error;
            }
            this.throw(parameters[0], error.message);
        }
    }
}
