import c from 'ansi-colors';
import { Rule } from '../rule';
import { ParsedRuleConfig } from '../config/types';

export class RuleError extends Error {
    /**
     * The rule that threw the error
     */
    public rule: Rule;

    /**
     * Original message. Used when logging error without throwing
     */
    public _message: string;

    /**
     * The required level with which the error was thrown
     */
    public required: ParsedRuleConfig['required'] | '';

    public constructor(rule: Rule, ...message: string[]) {
        const _message = message.join(' ');

        if (rule.description) {
            message.push('\n' + c.yellow(rule.description));
        }

        super(message.join(' '));

        this.rule = rule;
        this.required = this.rule.config.required || '';
        this.name = `RuleError | ${this.required.toUpperCase()} ${this.rule.name}`;
        this._message = _message;
    }

    public toString() {
        return `${c.grey(this.required.toUpperCase())} ${this._message}`;
    }
}
