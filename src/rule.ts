import { omitBy, defaultsDeep, keys, isError, has, isString, isUndefined } from 'lodash';

import { logger, Logger } from './log';
import { RuleError, ConfigError } from './errors';
import { Rulebook } from './rulebook';
import { specificity } from './utils';
import { RuleConfig, ParsedRuleConfig } from './config/types';
import { ruleConfigDefault } from './config/defaults';


/**
 * A testing rule
 *
 * @example
 * new Rule('foo')
 *     .describe(`
 *         An example rule
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
export class Rule {
    public name: string;
    public description?: string;
    public rulebook: Rulebook;
    public specificity: number;

    private _alias: string | null;
    private _config: ParsedRuleConfig;
    private _log: Logger;
    private _handler: {
        enforce: { (this: Rule, ...input: any): boolean|any }[];
        pass: { (this: Rule, input: any[]): void }[];
        fail: { (this: Rule, input: any[], result: any[]|Error): void }[];
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

    public constructor(name: string, rulebook: Rulebook) {
        this.name = this.validateName(name);
        this._alias = null;
        this.rulebook = rulebook;
        this.specificity = specificity(name);

        this._log = logger.child({ rule: name });
        this._config = ruleConfigDefault;

        this._handler = {
            enforce: [
                // eslint-disable-next-line no-shadow-restricted-names
                function undefined() {
                    throw new RuleError(this, 'Rule is undefined');
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
        }) as Partial<ParsedRuleConfig>;
    }

    /**
     * Set config while treating existing config as defaults.
     */
    public set config(config: Partial<RuleConfig>) {
        this._config = defaultsDeep(config, this._config);

        if (this._config.required === null) {
            this._config._throw = null;
            return;
        }

        this._config.required = this._config.required.toLowerCase() as RuleConfig['required'];

        if (this.rulebook.config) {
            const rulebookConfig = this.rulebook.config.generic;

            if (!has(rulebookConfig.severity, this._config.required)) {
                throw new ConfigError(
                    `Found unkown required level '${this._config.required}' in the`,
                    `configuration for rule '${this.name}'. Expected one of`,
                    `['${keys(rulebookConfig.severity).join(`', '`)}', null]`);
            }

            this._config._throw = rulebookConfig.severity[this._config.required];
        }
    }


    /**
     * Subscribe to an event
     *
     * @example
     * Rule.on('enforce', (val) => {
     *      return val > 5;
     * });
     *
     * @example
     * Rule.on('fail', (val) => {
     *     throw new Error(`Rule failed. Input: ${input}`)
     * });
     *
     * @example
     * Rule.on('pass', (val) => {
     *     console.log('Yay! The rule is uphold. Let\'s party!');
     * });
     */
    public on(event: 'enforce'|'fail'|'pass', fn: (this: Rule, ...params: any) => any) {
        this._log.debug(`Handler for event '${event}' added`);

        Object.defineProperty(fn, 'name', { value: event });

        if (event !== 'enforce' && event !== 'fail' && event !== 'pass') {
            throw new RuleError(this,
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
     * Define the rule logic.
     * Return `true` to reward, return anything else or throw an error
     * to punish.
     *
     * @example
     * Rule.define(function(val) {
     *     return val > 5;
     * });
     */
    public define(fn: (this: Rule, ...input: any) => boolean|any) {
        return this.on('enforce', fn);
    }


    /**
     * Define what will happen if the rule fails.  The returned/thrown value is
     * passed as the final argument.
     *
     * @example
     * Rule.punishment(function(input) {
     *     throw new Error(`Rule failed. Input: ${input}`)
     * });
     *
     * @example The final argument is the result of the definition
     * Rule.punishment(function(input, result) {
     *     this.throw(`Enforcing resulted in ${result}`);
     * });
     */
    public punishment(fn: (this: Rule, input: any, err: any) => void) {
        return this.on('fail', fn);
    }


    /**
     * Define what will happen if the rule passes.
     *
     * @example
     * Rule.reward(function(val) {
     *     console.log('Yay! The rule is uphold. Let\'s party!');
     * });
     */
    public reward(fn: (this: Rule, input: any[]) => void) {
        return this.on('pass', fn);
    }


    /**
     * Provide a human readable description of the rule.
     *
     * @example
     * Rule.describe(`
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
     * When enforcing use another rule(s) under the namespace of the current rule.
     * Any errors will be thrown under the currents rules name with required
     * level of the current rule.
     *
     * @example
     * Rule.alias('another/rule')
     *
     * @example
     * Rule.alias('another/*')
     */
    public alias(globPattern: string) {
        // Ideally we would check for the existence of the aliased rule
        // here, but at this point not all rules have been defined yet.
        // Instead we'll check as a part of `.enforce()`.

        // TODO: Find out if aliasses can be daisy chained
        this._log.debug(`Alias set to ${globPattern}`);
        this._alias = globPattern;
        return this;
    }


    /**
     * Enforce a rule.
     *
     * @example
     * Rule.enforce('foo');
     *
     * @example
     * Rule.enforce('foo', 'bar', 1, 86, 9302);
     */
    public async enforce(...input: any) {
        if (this._config._throw === null && !this._config._asAlias) {
            // Skip rule
            return this;
        }

        this._log.debug(`Event triggered: 'enforce'`);

        let result = null;
        if (this._alias !== null) {
            try {
                await this.enforceAlias(this._alias, input);

                // The aliased rule did not throw. Stop enforcing now to prevent
                // doing things twice. This also means that the current rule will
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
     * Throw an error or log a warning for this rule.
     * Required decides if it'll throw or log at which level.
     *
     * @example
     * Rule.throw('An error has occured');
     */
    public throw(...message: (any|Error)[]) {
        this._log.debug(`Throwing error`);

        let ruleError = message.find((partialMessage) => {
            return partialMessage instanceof RuleError;
        });
        if (isUndefined(ruleError)) {
            const errorMessages = message.map((value: any) => {
                if (isError(value)) {
                    return value.message;
                }
                else if (!isString(value)) {
                    return value.toString();
                }
                return value;
            }) as string[];

            ruleError = new RuleError(this, ...errorMessages);
        }

        const throwingRuleConfig = ruleError.rule._config;

        // Always throw when called as an aliased rule so we can handle the
        // error in the alias.
        if (throwingRuleConfig._throw === 'error' || this._config._asAlias) {
            throw ruleError;
        }
        if (throwingRuleConfig._throw === 'warn') {
            this._log.warn(ruleError.toString());
            return;
        }
        if (throwingRuleConfig._throw === 'info') {
            this._log.info(ruleError.toString());
        }
    }


    /**
     * Enforce by the definition of another rule
     */
    private async enforceAlias(aliasName: string, input: any[]) {
        this._log.debug(`Enforcing via alias ${this._alias}`);

        if (!this.rulebook.has(aliasName)) {
            throw new Error(`Could not find alias rule named '${aliasName}'`);
        }

        const aliased = this.rulebook.filter(aliasName);
        aliased.forEach((rule) => {
            // Tell the rule it's being enforced as an alias
            rule.config = { _asAlias: true };

            // We are not copying the config of the current rule to the alias.
            // We may want to add that at some point, but I quite frankly don't
            // see why it's worth the effort.
        });

        try {
            await aliased.enforce(aliasName, ...input);
            this._log.debug('Alias rule uphold');
        }
        catch (error) {
            this._log.debug(`Alias rule broken`);
            this.description = error.rule.description;
            throw new Error(error._message);
        }
        finally {
            aliased.forEach((rule) => {
                rule.config = { _asAlias: false };
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
            this._log.debug(`Rule uphold`);
            await this.raiseVoidEvent('pass', input);
        }
        else {
            this._log.debug(`Rule broken`);
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
            if (error instanceof RuleError) {
                throw error;
            }
            this.throw(error.message);
        }
    }

    private validateName(name: string) {
        const re = new RegExp(/^[\w-/@|]+$/, 'g');

        if (re.exec(name) === null) {
            const demands = [
                '',
                'Lowercase letters',
                'Uppercase letters',
                'Numbers',
                'These symbols: /-_|@',
            ]

            throw new Error(`'${name}' is not a valid rule name. `
                + `\nRule names are restricted to:${demands.join('\n- ')}`);
        }

        return name;
    }
}
