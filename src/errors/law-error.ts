import c from 'ansi-colors';
import { Law } from '../law';
import { ParsedLawConfig } from '../config/types';
import { isObject } from 'lodash';

export class LawError extends Error {
    /**
     * The law that threw the error
     */
    public law: Law;

    /**
     * The human readable description provided with the law
     */
    public description: string;

    /**
     * The required level with which the error was thrown
     */
    public required: ParsedLawConfig['required'] | '';

    // TODO: DELETE: public config: ConfigManager;

    // private _message: string[];
    public input: any[];

    public constructor(law: Law, input: any[], ...message: string[]) {
        super(message.join(' '));

        this.law = law;
        this.required = (this.law.config.required || '');
        this.name = `LawError | ${this.required.toUpperCase()} ${this.law.name}`;

        // TODO: What?
        this.input = input;
        this.description = message.join(' ');
        // this.description = 'description';
    }

    public toString() {
        return `${c.grey(this.required.toUpperCase())} ${this.description}`;
    }

    // private _addDescriptionToMessage(severityConfig: any) {
    //     if (this.description && severityConfig.description) {
    //         this.message += '\n\nDescription:\n' + this._indent(this.description);
    //     }
    // }

    // private _addInputToMessage(severityConfig: any) {
    //     if (!this.input || this.input.length === 0 || !severityConfig.input) {
    //         return;
    //     }

    //     this.message += `\n\nLaw input:\n`;

    //     const stringifiedInput = this.input.map((parameter: any, i: number) => {
    //         if (isObject(parameter)) {
    //             return `${i}: ${JSON.stringify(parameter, null, 2)}`;
    //         }
    //         return `${i}: ${parameter.toString()}`
    //     });

    //     this.message += this._indent(stringifiedInput.join('\n'));
    // }

    // private _indent(string: string) {
    //     return '  ' + string.replace(/\n/g, '\n  ');
    // }
}
