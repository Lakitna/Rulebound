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

import { ruleConfigDefault } from './config/defaults';
import { ParsedRuleConfig, RuleConfig, severityLevel } from './config/types';
import { ConfigError, RuleError } from './errors';
import { logger, Logger } from './log';
import { Rulebook } from './rulebook';
import { specificity } from './utils';

type enforceHandler<I> = (
    this: Rule<I>,
    input: I,
    ruleConfig: RuleConfig
) => true | unknown | Promise<true | unknown>;
type passHandler<I> = (this: Rule<I>, input: I) => void | Promise<void>;
type failHander<I> = (this: Rule<I>, input: I, result: unknown[] | Error) => void | Promise<void>;

interface ruleEventHandlers {
    enforce: enforceHandler<any>[];
    pass: passHandler<any>[];
    fail: failHander<any>[];
}

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
    public specificity: number;

    private _alias: string | null;
    private _config: ParsedRuleConfig;
    private _log: Logger<{ rule: string }>;
    private _handler: ruleEventHandlers;

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
        this.specificity = specificity(name);

        this._log = logger.child({ rule: name });
        this._config = ruleConfigDefault;

        this._handler = {
            enforce: [
                // eslint-disable-next-line no-shadow-restricted-names
                function undefined() {
                    throw new RuleError(this as Rule, 'Rule is undefined');
                },
            ],
            pass: [
                // eslint-disable-next-line no-shadow-restricted-names
                function undefined() {
                    return;
                },
            ],
            fail: [
                // eslint-disable-next-line no-shadow-restricted-names
                function undefined(_, result) {
                    this.throw(result);
                },
            ],
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

        if (this._config.required === null) {
            this._config._throw = null;
            return this;
        }

        this._config.required = this._config.required.toLowerCase() as RuleConfig['required'];

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
    public on<E extends keyof ruleEventHandlers>(
        event: E,
        function_: E extends 'enforce'
            ? enforceHandler<I>
            : E extends 'fail'
            ? failHander<I>
            : E extends 'pass'
            ? passHandler<I>
            : never
    ) {
        this._log.debug(`Handler added for event '${event}'`);

        Object.defineProperty(function_, 'name', { value: event });

        if (event !== 'enforce' && event !== 'fail' && event !== 'pass') {
            throw new RuleError(this, `You tried to subscribe to unkown event '${event}'`);
        }

        const handlers = this._handler[event] as typeof function_[];

        // Delete default `undefined` handler function
        if (handlers.length === 1 && handlers[0].name.startsWith('undefined')) {
            handlers.shift();
        }

        handlers.push(function_);
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
    public define(function_: enforceHandler<I>) {
        this.on('enforce', function_);
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
    public punishment(function_: failHander<I>) {
        this.on('fail', function_);
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
    public reward(function_: passHandler<I>) {
        this.on('pass', function_);
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
            // Will allow for paragraph line breaks and stuff
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
    public async enforce(input: I) {
        if (this._config._throw === null && !this._config._asAlias) {
            // Skip rule
            return this;
        }

        this._log.debug(`Event: 'enforce'`);

        let result: Error | any[];
        try {
            if (this._alias !== null) {
                await this.enforceAlias(this._alias, input);
                // The aliased rule did not throw. Stop enforcing now to prevent
                // doing things twice. This also means that the current rule will not reward.
                return this;
            }

            result = [];
            for (const enforceHandler of this._handler.enforce) {
                result.push(await enforceHandler.call(this as Rule<I>, input, this.config()));
            }
        } catch (error) {
            result = isError(error)
                ? error
                : new TypeError(
                      `Rule ${this.name} threw non-error (typeof ${typeof error}): ` + error
                  );
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
    public throw(...message: (any | Error)[]) {
        this._log.debug(`Throwing error`);

        let ruleError: RuleError | undefined = message.find((partialMessage) => {
            return partialMessage instanceof RuleError;
        });
        if (isUndefined(ruleError)) {
            const errorMessages = message.flat().map((value: any) => {
                if (isError(value)) {
                    return value.message;
                } else if (!isString(value)) {
                    return value.toString();
                }
                return value;
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

    /**
     * Enforce by the definition of another rule
     */
    private async enforceAlias(aliasName: string, input: I) {
        this._log.debug(`Enforcing via alias ${this._alias}`);

        if (!this.rulebook) {
            throw new Error(`Rule is not part of a Rulebook. Can't look for alias '${aliasName}'`);
        }
        if (!this.rulebook.has(aliasName)) {
            throw new Error(`Could not find alias rule named '${aliasName}'`);
        }

        // eslint-disable-next-line unicorn/no-array-callback-reference
        const aliased = this.rulebook.filter(aliasName);
        for (const rule of aliased.rules) {
            // Tell the rule it's being enforced as an alias
            rule.config({ _asAlias: true });

            // We are not copying the config of the current rule to the alias.
            // We may want to add that at some point, but I quite frankly don't
            // see why it's worth the effort.
        }

        try {
            await aliased.enforce(aliasName, input);
            this._log.debug('Alias rule uphold');
        } catch (error) {
            if (error instanceof RuleError) {
                this._log.debug(`Alias rule broken`);
                // this.description = error.rule.description;
                throw new Error(error.message);
            }
            throw error;
        } finally {
            // Reset the alias flag behind ourselves
            for (const rule of aliased.rules) {
                rule.config({ _asAlias: false });
            }
        }
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

        await (failResults.length === 0
            ? this.raiseVoidEvent('pass', input)
            : this.raiseVoidEvent('fail', input, results));
    }

    /**
     * Raise void event and handle any errors
     */
    private async raiseVoidEvent(event: 'pass' | 'fail', input: I, results?: Error | unknown[]) {
        this._log.debug(`Event: '${event}'`);

        try {
            for (const function_ of this._handler[event]) {
                await function_.call(
                    this,
                    input,
                    // @ts-expect-error Some handlers get this val, some don't.
                    results
                );
            }
        } catch (error) {
            if (error instanceof RuleError) {
                throw error;
            }
            if (isError(error)) {
                this.throw(error.message);
            }
            // Unexpected non-error
            throw error;
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
