import c from 'ansi-colors';
import { Law } from '../law';
import { ParsedLawConfig } from '../config/types';

export class LawError extends Error {
    /**
     * The law that threw the error
     */
    public law: Law;

    /**
     * Original message. Used when logging error without throwing
     */
    public _message: string;

    /**
     * The required level with which the error was thrown
     */
    public required: ParsedLawConfig['required'] | '';

    public constructor(law: Law, ...message: string[]) {
        const _message = message.join(' ');

        if (law.description) {
            message.push('\n' + c.yellow(law.description));
        }

        super(message.join(' '));

        this.law = law;
        this.required = (this.law.config.required || '');
        this.name = `LawError | ${this.required.toUpperCase()} ${this.law.name}`;
        this._message = _message;
    }

    public toString() {
        return `${c.grey(this.required.toUpperCase())} ${this._message}`;
    }
}
