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
    public required: ParsedRuleConfig['required'];
    public severity: severityLevel;

    public constructor(rule: Rule, ...message: string[]) {
        const message_ = message.join('\n');
        super(message_);

        this.rule = rule.name;
        this.required = rule.config().required;
        this.severity = rule.severity;
        this.name = `RuleError | ${this.required.toUpperCase()} ${this.rule}`;

        if (rule.description) {
            // Insert the description between the error message and the stack
            const preStack = this.name + (message_.length > 0 ? ': ' + message_ : '');
            this.stack = this.stack?.replace(
                preStack,
                preStack + '\n' + c.yellow(rule.description)
            );
        }
    }

    public toString() {
        return `${c.grey(this.required.toUpperCase())} ${this.message}`;
    }
}
