import * as _ from 'lodash';

import { log } from './log';
import { LawError, ConfigError } from './errors/index';
import { LawConfig } from './config/types';
import Lawbook from './lawbook';
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
export default class Law {
    public name: string;
    public description: string|undefined;
    public specificity: number;
    public lawbook: Lawbook;
    private _config: LawConfig;
    private on: {
        enforce: (this: Law, ...input: any) => boolean|any,
        pass: (this: Law, input: any[]) => void,
        fail: (this: Law, input: any[], err: any|Error) => void,
    };

    constructor(name: string, lawbook: Lawbook) {
        this.name = name;
        this.lawbook = lawbook;
        this.specificity = specificity(name);

        this._config = {
            severity: 'must',
            _throw: 'error',
            _specificity: 0,
        };

        this.on = {
            enforce: function undefined(...input) {
                throw new LawError(this, 'Law is undefined');
            },

            pass: function undefined(input) { return; },

            fail: function undefined(input, err) {
                if (err) {
                    throw err;
                }
                else {
                    this.throw();
                }
            },
        };
    }

    /**
     * Get config, omitting keys that start with `_`
     */
    get config() {
        return _.omitBy(this._config, (val, key) => {
            return key.startsWith('_');
        });
    }

    /**
     * Set config while treating existing config as defaults
     */
    set config(config: LawConfig) {
        this._config = _.defaultsDeep(config, this._config);

        if (this._config.severity === undefined) {
            this._config.severity = 'must';
        }
        if (this._config.severity === null) {
            this._config._throw = null;
            return;
        }

        this._config.severity = this._config.severity.toLowerCase() as LawConfig['severity'];

        if (this.lawbook.config) {
            const lawbookConfig = this.lawbook.config.generic;

            if (!lawbookConfig.severity.hasOwnProperty(this._config.severity!)) {
                throw new ConfigError(
                    `Found unkown severity '${this._config.severity}' in the`,
                    `configuration for law '${this.name}'. Expected one of`,
                    `['${_.keys(lawbookConfig.severity).join(`', '`)}', null]`);
            }

            this._config._throw = lawbookConfig.severity[this._config.severity!];
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
        log.withScope(this.name).debug(`Law defined`);

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
        log.withScope(this.name).debug(`Punishment defined`);

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
        log.withScope(this.name).debug(`Reward defined`);

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
            // Get rid of whitespace at the start of all lines
            .replace(/^[^\S\n]+/gm, '');

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
        if (this._config._throw === null) {
            return this;
        }

        log.withScope(this.name).debug(`Enforcing`);

        let result = null;
        try {
            result = this.on.enforce.call(this, ...input);

            if (result instanceof Promise) {
                result = await result;
            }
        }
        catch (err) {
            result = err;
        }

        if (result === true) {
            log.withScope(this.name).debug(`Law passed. Rewarding`);

            try {
                this.on.pass.call(this, input);
            }
            catch (err) {
                if (err instanceof LawError) {
                    throw err;
                }
                this.throw(err.message);
            }
        }
        else {
            log.withScope(this.name).debug(`Law failed. Punishing`);

            try {
                this.on.fail.call(this, input, result);
            }
            catch (err) {
                if (err instanceof LawError) {
                    throw err;
                }
                this.throw(err.message);
            }
        }

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
        log.withScope(this.name).debug(`Throwing error`);

        message = message.map((msg: any) => {
            if (msg instanceof Error) {
                return msg.message;
            }
            return msg;
        });

        const lawError = new LawError(this, ...message);

        if (this._config._throw === 'error') {
            throw lawError;
        }
        if (this._config._throw === 'warn') {
            log.withScope(this.name).warn(lawError.toString());
            return;
        }
        if (this._config._throw === 'log') {
            log.withScope(this.name).log(lawError.toString());
            return;
        }
    }
}
