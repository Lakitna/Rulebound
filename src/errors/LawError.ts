import * as c from 'ansi-colors';
import { Law } from '../law';
import { severityLevel } from '../config/types';

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
     * The severity with which the error was thrown
     */
    public severity: severityLevel;

    constructor(law: Law, ...message: string[]) {
        const _message = message.join(' ');

        if (law.description) {
            message.push('\n' + c.yellow(law.description));
        }

        super(message.join(' '));

        this.law = law;
        this.severity = (this.law.config.severity || '').toUpperCase() as severityLevel;
        this.name = `LawError | ${this.severity} ${this.law.name}`;
        this._message = _message;
    }

    public toString() {
        return `${c.grey(this.severity!)} ${this._message}`;
    }
}
