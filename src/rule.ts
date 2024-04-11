import { GlobSpecificity, globSpecificity } from 'glob-specificity';
import {
    cloneDeep,
    defaultsDeep,
    has,
    isError,
    isString,
    isUndefined,
    keys,
    omitBy,
} from 'lodash-es';
import util from 'node:util';

import { ruleConfigDefault } from './config/defaults';
import { ParsedRuleConfig, RuleConfig, severityLevel } from './config/types';
import { ConfigError, RuleError } from './errors';
import { Logger, logger } from './log';
import { Rulebook } from './rulebook';

type enableHandler<I> = (
    this: Rule<I>,
    input: I,
    ruleConfig: RuleConfig
) => true | unknown | Promise<true | unknown>;
type enforceHandler<I> = (
    this: Rule<I>,
    input: I,
    ruleConfig: RuleConfig
) => true | unknown | Promise<true | unknown>;
type passHandler<I> = (this: Rule<I>, input: I, ruleConfig: RuleConfig) => void | Promise<void>;
type failHandler<I> = (
    this: Rule<I>,
    input: I,
    ruleConfig: RuleConfig,
    result: unknown[] | Error
) => void | Promise<void>;

interface ruleEventHandlers<I> {
    enable: enableHandler<I>[];
    enforce: enforceHandler<I>[];
    pass: passHandler<I>[];
    fail: failHandler<I>[];
}

const defaultEnableHandler: enableHandler<any> = function enable() {
    // No handler -> Enable rule
    return true;
};
const defaultEnforceHandler: enforceHandler<any> = function enforce() {
    // No handler -> Throw error
    return new RuleError(this as Rule, 'Rule not defined');
};
const defaultPassHandler: passHandler<any> = function pass() {
    // No handler -> Do nothing
    return;
};
const defaultFailHandler: failHandler<any> = function fail(_input, _config, results) {
    // No handler -> Rethrow error
    return this.throw(results);
};

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
export class Rule<I = unknown> {
    public name: string;
    public description?: string;
    public rulebook?: Rulebook;
    public specificity: GlobSpecificity;

    private _alias: string | null;
    private _config: ParsedRuleConfig;
    private _log: Logger<{ rule: string }>;
    private _handler: ruleEventHandlers<I>;

    /**
     * Use context to share state between events
     */
    public context: {
        [key: string]: any;
    };
    public ctx: {
        [key: string]: any;
    };

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
    public constructor(name: string, rulebook?: Rulebook) {
        this.name = this.validateName(name);
        this._alias = null;
        this.rulebook = rulebook;
        this.specificity = globSpecificity(name);

        this._log = logger.child({ rule: name });
        this._config = ruleConfigDefault;

        this._handler = {
            enable: [],
            enforce: [],
            pass: [],
            fail: [],
        };

        this.context = {};
        this.ctx = this.context;
    }

    public config(): RuleConfig;
    public config(config: Partial<RuleConfig>): Rule<I>;
    public config(config?: Partial<RuleConfig>): Rule<I> | RuleConfig {
        if (!config) {
            return omitBy(this._config, (_, key) => {
                return key.startsWith('_');
            }) as RuleConfig;
        }

        this._config = defaultsDeep(config, this._config);

        if (this._config.required === null || this._config.required === 'omit') {
            this._config._throw = null;
            return this;
        }

        this._config.required = this._config.required.toLowerCase() as Exclude<
            RuleConfig['required'],
            'omit' | null
        >;

        if (this.rulebook?.config) {
            const rulebookConfig = this.rulebook.config.generic;

            if (!has(rulebookConfig.severity, this._config.required)) {
                throw new ConfigError(
                    `Found unkown required level '${this._config.required}' in the`,
                    `configuration for rule '${this.name}'. Expected one of`,
                    `['${keys(rulebookConfig.severity).join("', '")}', null]`
                );
            }

            this._config._throw = rulebookConfig.severity[this._config.required];
        }

        return this;
    }

    public clone(): Rule<I> {
        return cloneDeep(this);
    }

    get severity(): severityLevel {
        return this._config._throw;
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
     *     console.log(`Yay! The rule is uphold. Let's party!`);
     * });
     */
    public on<E extends keyof ruleEventHandlers<I>>(
        event: E,
        handlerFunction: ruleEventHandlers<I>[E][0]
    ) {
        this._log.trace(`Handler added for event '${event}'`);

        Object.defineProperty(handlerFunction, 'name', { value: event });

        if (this._handler[event] === undefined) {
            throw new RuleError(this as Rule, `Tried to subscribe to unkown event '${event}'`);
        }

        const handlers = this._handler[event] as (typeof handlerFunction)[];
        handlers.push(handlerFunction);

        return this;
    }

    public enable(handlerFunction: enableHandler<I>) {
        this.on('enable', handlerFunction);
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
    public define(handlerFunction: enforceHandler<I>) {
        this.on('enforce', handlerFunction);
        return this;
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
    public punishment(handlerFunction: failHandler<I>) {
        this.on('fail', handlerFunction);
        return this;
    }

    /**
     * Define what will happen if the rule passes.
     *
     * @example
     * Rule.reward(function(val) {
     *     console.log('Yay! The rule is uphold. Let\'s party!');
     * });
     */
    public reward(handlerFunction: passHandler<I>) {
        this.on('pass', handlerFunction);
        return this;
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
            .replace(/^[^\S\n]+/gm, '')
            // Simplify whitespace in a markdown-like fashion
            .replace(/([\d"',.:;A-Za-z])\n(["',.:;A-Za-z]|\d+[^\d.])/g, '$1 $2');

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
        // Instead we'll check during `.enforce()`.

        this._log.debug(`Alias set to '${globPattern}'`);
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
     * Rule.enforce({ foo: 123, bar: 'lorum' });
     *
     * @example
     * Rule.enforce(['foo', 'bar', 1, 86, 9302]);
     */
    public async enforce(input: I) {
        if (this._config._throw === null && !this._config._asAlias) {
            // Skip rule
            this.handleEnableResult([`Rule config "required: ${this._config.required}"`]);
            return this;
        }

        let enableResult: Error | unknown[];
        try {
            enableResult = await this.raiseEvent('enable', defaultEnableHandler, input);
        } catch (error: unknown) {
            enableResult = isError(error) ? error : [error];
        }
        const enabled = this.handleEnableResult(enableResult);
        if (!enabled) {
            return this;
        }

        let enforceResult: Error | unknown[];
        try {
            if (isString(this._alias)) {
                await this.enforceAlias(this._alias, input);
                // We don't know the results of the alias, but we do know it did not fail.
                enforceResult = [];
            } else {
                enforceResult = await this.raiseEvent('enforce', defaultEnforceHandler, input);
            }
        } catch (error: unknown) {
            enforceResult = isError(error) ? error : [error];
        }

        await this.handleEnforceResult(input, enforceResult);
        return this;
    }

    /**
     * Throw an error or log a warning for this rule.
     * Rule config decides if it'll throw or log at which level.
     *
     * @example
     * Rule.throw('An error has occured');
     */
    public throw(...message: (unknown | Error)[]) {
        this._log.trace(`Throwing error`);

        let ruleError = message.find((partialMessage): partialMessage is RuleError => {
            return partialMessage instanceof RuleError;
        });

        if (isUndefined(ruleError)) {
            const errorMessages: string[] = message.flat().map((value: unknown) => {
                if (isError(value)) {
                    return value.message;
                }
                if (isString(value)) {
                    return value;
                }
                return String(value);
            });

            ruleError = new RuleError(this as Rule, ...errorMessages);
        }

        // Always throw when called as an aliased rule so we can handle the
        // error in the alias.
        if (ruleError.severity === 'error' || this._config._asAlias) {
            throw ruleError;
        }
        if (ruleError.severity === 'warn') {
            this._log.warn(ruleError.toString());
            return;
        }
        if (ruleError.severity === 'info') {
            this._log.info(ruleError.toString());
        }
    }

    private async raiseEvent<E extends keyof ruleEventHandlers<I>>(
        event: E,
        defaultHandler: ruleEventHandlers<I>[E][0],
        input: I,
        enforceResults?: E extends 'fail' ? Error | unknown[] : undefined
    ): Promise<unknown[]> {
        this._log.trace(`Event: '${event}'`);

        const handlers = this._handler[event] as (typeof defaultHandler)[];
        if (handlers.length === 0) {
            handlers.push(defaultHandler);
        }

        let result: Error | unknown[];
        try {
            result = await Promise.all(
                handlers.map((handler) => {
                    return handler.call(
                        this as Rule<I>,
                        input,
                        this.config(),
                        // @ts-expect-error TS being overeager
                        enforceResults
                    );
                })
            );
        } catch (error) {
            if (isError(error)) {
                throw error;
            }
            throw new TypeError(
                `Rule ${this.name} threw non-error (typeof ${typeof error}) in ${event} handler: ` +
                    error
            );
        }

        return result;
    }

    private handleEnableResult(results: Error | unknown[]): boolean {
        if (isError(results)) {
            results = [results];
        }

        let enabled = true;
        for (const result of results) {
            if (result === true) {
                continue;
            }

            enabled = false;

            if (result === false) {
                this._log.debug('Rule disabled');
            } else if (isError(result)) {
                this._log.error('Rule disabled: ' + result.message);
            } else {
                this._log.debug(
                    'Rule disabled: ' + (isString(result) ? result : util.inspect(result))
                );
            }
            break;
        }

        return enabled;
    }

    /**
     * Determine what to do with the enforce results
     */
    private async handleEnforceResult(input: I, results: unknown[] | Error) {
        let failResults: unknown[] = [];
        if (isError(results)) {
            failResults.push(results);
        } else {
            failResults = results.filter((r) => r !== true);
        }

        if (failResults.length === 0) {
            return this.raiseEvent('pass', defaultPassHandler, input);
        }

        try {
            return await this.raiseEvent('fail', defaultFailHandler, input, results);
        } catch (error) {
            if (error instanceof RuleError) {
                throw error;
            }
            this.throw(error);
        }
    }

    /**
     * Enforce by the definition of another rule
     */
    private async enforceAlias(aliasName: string, input: I) {
        this._log.debug(`Enforcing via alias ${this._alias}`);

        if (!this.rulebook) {
            throw new RuleError(
                this as Rule,
                `Rule is not part of a Rulebook. Can't look for alias '${aliasName}'`
            );
        }
        if (!this.rulebook.has(aliasName)) {
            throw new RuleError(this as Rule, `Could not find alias rule named '${aliasName}'`);
        }

        // eslint-disable-next-line unicorn/no-array-callback-reference
        const aliasedRules = this.rulebook.getRules(aliasName);
        for (const aliasedRule of aliasedRules) {
            const originalConfig = aliasedRule.config();
            const aliasConfig = defaultsDeep(
                // Tell the rule it's being enforced as an alias
                { _asAlias: true, _originalConfig: originalConfig },
                this.config(),
                originalConfig
            );
            aliasedRule.config(aliasConfig);
        }

        try {
            await this.rulebook.enforce(aliasName, input);
            this._log.debug('Alias rule uphold');
        } catch (error) {
            if (error instanceof RuleError) {
                this._log.debug(`Alias rule broken`);
                this.description = this.description ?? error.description;
                throw new Error(error.message);
            }
            throw error;
        } finally {
            // Reset the alias config behind ourselves
            for (const aliasedRule of aliasedRules) {
                aliasedRule.config({ _asAlias: false });
                const originalConfig = aliasedRule._config._originalConfig;
                aliasedRule.config(originalConfig);
            }
        }
    }

    private validateName(name: string) {
        const re = new RegExp(/^[\w/@|-]+$/, 'g');

        if (re.exec(name) === null) {
            const demands = [
                '',
                'Lowercase letters',
                'Uppercase letters',
                'Numbers',
                'These symbols: /-_|@',
            ];

            throw new Error(
                `'${name}' is not a valid rule name. ` +
                    `\nRule names are restricted to:${demands.join('\n- ')}`
            );
        }

        return name;
    }
}
