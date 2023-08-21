import c from 'ansi-colors';
import { ParsedRuleConfig, severityLevel } from '../config/types';
import { Rule } from '../rule';

export class RuleError extends Error {
    /**
     * The rule that threw the error
     */
    public rule: string;

    /**
     * The required level with which the error was thrown
     */
    public required: Exclude<ParsedRuleConfig['required'], null>;
    public severity: severityLevel;
    public description?: string;

    public constructor(rule: Rule, ...message: string[]) {
        const message_ = message.join('\n');
        super(message_);

        this.rule = rule.name;
        this.required = rule.config().required || 'omit';
        this.severity = rule.severity;
        this.description = rule.description;

        this.name = `RuleError | ${this.required.toUpperCase()} ${this.rule}`;
    }

    public toString() {
        return `${c.grey(this.required.toUpperCase())} ${this.message}`;
    }
}
