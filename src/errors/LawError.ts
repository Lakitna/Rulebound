import * as c from 'ansi-colors';
import Law from '../law';
import { severityLevel } from '../config/types';

export class LawError extends Error {
    /**
     * The law that threw the error
     */
    public law: Law;

    /**
     * String used when logging the error without throwing
     */
    public warnMessage: string;

    /**
     * The severity with which the error was thrown
     */
    public severity: severityLevel;

    constructor(law: Law, ...message: string[]) {
        const warnMessage = message.join(' ');

        if (law.description) {
            message.push('\n' + c.yellow(law.description));
        }

        super(message.join(' '));

        this.law = law;
        this.severity = (this.law.config.severity || '').toUpperCase() as severityLevel;
        this.name = `LawError | ${this.severity} ${this.law.name}`;
        this.warnMessage = warnMessage;
    }

    public toString() {
        return `${c.grey(this.severity!)} ${this.warnMessage}`;
    }
}
