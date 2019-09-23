import * as c from 'ansi-colors';
import { Law } from '../law';
import { LawConfig } from '../config/types';
import { ConfigManager } from '../config/manager';
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
     * The input that resulted in the law failure
     */
    public input: any;

    /**
     * The severity with which the error was thrown
     */
    public severity: LawConfig['severity'];

    public config: ConfigManager

    public constructor(law: Law, input: any[], ...message: string[]) {
        super(message.join(' '));

        this.law = law;
        this.description = this.law.description || '';
        this.input = input;
        this.severity = (this.law.config.severity || '') as LawConfig['severity'];
        this.name = `${this.severity.toUpperCase()} law ${this.law.name} was broken`;

        this.config = this.law.lawbook.config;

        if (this.config) {
            const severityConfig = this.config.generic.severity[this.severity];
            this._addDescriptionToMessage(severityConfig);
            this._addInputToMessage(severityConfig);
        }
    }

    public toString() {
        let returnString = `${c.grey(this.name + ':')}`;

        returnString += `\n${this.message.trim()}`;

        return returnString;
    }

    private _addDescriptionToMessage(severityConfig: any) {
        if (this.description && severityConfig.description) {
            this.message += '\n\nDescription:\n' + this._indent(this.description);
        }
    }

    private _addInputToMessage(severityConfig: any) {
        if (!this.input || this.input.length === 0 || !severityConfig.input) {
            return;
        }

        this.message += `\n\nLaw input:\n`;

        const stringifiedInput = this.input.map((parameter: any, i: number) => {
            if (isObject(parameter)) {
                return `${i}: ${JSON.stringify(parameter, null, 2)}`;
            }
            return `${i}: ${parameter.toString()}`
        });

        this.message += this._indent(stringifiedInput.join('\n'));
    }

    private _indent(string: string) {
        return '  ' + string.replace(/\n/g, '\n  ');
    }
}
