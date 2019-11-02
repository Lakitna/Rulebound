import { omitBy, defaultsDeep, keys, isError, has, isString, isUndefined } from 'lodash';

import { logger, Logger } from './log';
import { LawError, ConfigError } from './errors';
import { Lawbook } from './lawbook';
import { specificity } from './utils';
import { LawConfig, ParsedLawConfig } from './config/types';
import { lawConfigDefault } from './config/defaults';


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
    public lawbook: Lawbook;
    public specificity: number;

    private _alias: string | null;
    private _config: ParsedLawConfig;
    private _log: Logger;
    private _handler: {
        enforce: { (this: Law, ...input: any): boolean|any }[];
        pass: { (this: Law, input: any[]): void }[];
        fail: { (this: Law, input: any[], result: any[]|Error): void }[];
    };

    /**
     * Use context to share state between events
     */
    public context: {
        [key: string]: any;
    }
    public ctx: {
        [key: string]: any;
    }

    public constructor(name: string, lawbook: Lawbook) {
        this.name = this._validateName(name);
        this._alias = null;
        this.lawbook = lawbook;
        this.specificity = specificity(name);

        this._log = logger.child({ law: name });
        this._config = lawConfigDefault;

        this._handler = {
            enforce: [
                // eslint-disable-next-line no-shadow-restricted-names
                function undefined() {
                    throw new LawError(this, 'Law is undefined');
                },
            ],
            pass: [
                // eslint-disable-next-line no-shadow-restricted-names
                function undefined() { return; },
            ],
            fail: [
                // eslint-disable-next-line no-shadow-restricted-names
                function undefined(_, result) {
                    this.throw(result);
                },
            ],
        }

        this.context = {};
        this.ctx = this.context;
    }


    /**
     * Get config, omitting keys that start with `_`.
     */
    public get config() {
        return omitBy(this._config, (_, key) => {
            return key.startsWith('_');
        }) as Partial<ParsedLawConfig>;
    }

    /**
     * Set config while treating existing config as defaults.
     */
    public set config(config: Partial<LawConfig>) {
        this._config = defaultsDeep(config, this._config);

        if (this._config.required === null) {
            this._config._throw = null;
            return;
        }

        this._config.required = this._config.required.toLowerCase() as LawConfig['required'];

        if (this.lawbook.config) {
            const lawbookConfig = this.lawbook.config.generic;

            if (!has(lawbookConfig.severity, this._config.required)) {
                throw new ConfigError(
                    `Found unkown required level '${this._config.required}' in the`,
                    `configuration for law '${this.name}'. Expected one of`,
                    `['${keys(lawbookConfig.severity).join(`', '`)}', null]`);
            }

            this._config._throw = lawbookConfig.severity[this._config.required];
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
        this._log.debug(`Handler for event '${event}' added`);

        Object.defineProperty(fn, 'name', { value: event });

        if (event !== 'enforce' && event !== 'fail' && event !== 'pass') {
            throw new LawError(this,
                `You tried to subscribe to unkown event '${event}'`);
        }

        // Delete default `undefined` handler function
        const handlers = this._handler[event];
        if (handlers.length === 1 && handlers[0].name.startsWith('undefined')) {
            handlers.shift();
        }

        this._handler[event].push(fn);
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
    public define(fn: (this: Law, ...input: any) => boolean|any) {
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
    public punishment(fn: (this: Law, input: any, err: any) => void) {
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
    public reward(fn: (this: Law, input: any[]) => void) {
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
        this.description = description
            .trim()
            // Get rid of whitespace at the start of each line
            .replace(/^[^\S\n]+/gm, '');

        return this;
    }


    /**
     * When enforcing use another law(s) under the namespace of the current law.
     * Any errors will be thrown under the currents laws name with required
     * level of the current law.
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
        // Instead we'll check as a part of `.enforce()`.

        // TODO: Find out if aliasses can be daisy chained
        this._log.debug(`Alias set to ${globPattern}`);
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

        this._log.debug(`Event triggered: 'enforce'`);

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
                for (const fn of this._handler.enforce) {
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
     * Required decides if it'll throw or log at which level.
     *
     * @example
     * Law.throw('An error has occured');
     */
    public throw(...message: (any|Error)[]) {
        this._log.debug(`Throwing error`);

        let lawError = message.find((partialMessage) => {
            return partialMessage instanceof LawError;
        });
        if (isUndefined(lawError)) {
            const errorMessages = message.map((value: any) => {
                if (isError(value)) {
                    return value.message;
                }
                else if (!isString(value)) {
                    return value.toString();
                }
                return value;
            }) as string[];

            lawError = new LawError(this, ...errorMessages);
        }

        const throwingLawConfig = lawError.law._config;

        // Always throw when called as an aliased law so we can handle the
        // error in the alias.
        if (throwingLawConfig._throw === 'error' || this._config._asAlias) {
            throw lawError;
        }
        if (throwingLawConfig._throw === 'warn') {
            this._log.warn(lawError.toString());
            return;
        }
        if (throwingLawConfig._throw === 'info') {
            this._log.info(lawError.toString());
            return;
        }
    }


    /**
     * Enforce by the definition of another law
     */
    private async enforceAlias(aliasName: string, input: any[]) {
        this._log.debug(`Enforcing via alias ${this._alias}`);

        if (!this.lawbook.has(aliasName)) {
            throw new Error(`Could not find alias law named '${aliasName}'`);
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
            this._log.debug('Alias law uphold');
        }
        catch (error) {
            this._log.debug(`Alias law broken`);
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
    private async handleEnforceResult(input: any[], results: any[]|Error) {
        let failResults = [];
        if (isError(results)) {
            failResults.push(results);
        }
        else {
            failResults = results.filter((r: any) => r !== true);
        }

        if (failResults.length === 0) {
            this._log.debug(`Law uphold`);
            await this.raiseVoidEvent('pass', input);
        }
        else {
            this._log.debug(`Law broken`);
            await this.raiseVoidEvent('fail', input, results);
        }
    }

    /**
     * Raise void event and handle any errors
     */
    private async raiseVoidEvent(event: string, ...parameters: any) {
        this._log.debug(`Event triggered: '${event}'`);

        try {
            for (const fn of this._handler[event]) {
                await fn.call(this, ...parameters);
            }
        }
        catch (error) {
            if (error instanceof LawError) {
                throw error;
            }
            this.throw(error.message);
        }
    }

    private _validateName(name: string) {
        const re = new RegExp(/^[A-Za-z0-9/\-_@|]+$/, 'g');

        if (re.exec(name) === null) {
            const demands = [
                '',
                'Lowercase letters',
                'Uppercase letters',
                'Numbers',
                'These symbols: /-_|@',
            ]

            throw new Error(`'${name}' is not a valid law name. `
                + `\nLaw names are restricted to:${demands.join('\n- ')}`);
        }

        return name;
    }
}
