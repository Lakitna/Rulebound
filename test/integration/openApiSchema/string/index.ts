import { isString } from 'lodash-es';
import { Rulebook } from '../../../../src/rulebook';
import { OasRuleParameters } from '../openapi-schema';

export interface OasRuleParametersString {
    string: string;
    schema: Record<string, any>;
}

export default async (rulebook: Rulebook<OasRuleParameters>) => {
    const subRules = ['format', 'not-empty', 'max-length', 'min-length', 'pattern', 'enum'];

    for (const rule of subRules) {
        const module = await import(`./${rule}`);
        await module.default(rulebook);
    }

    return rulebook.add('openapi-schema/string/type').define(async function (inp) {
        let string = inp.json as unknown as string;

        if (!isString(string)) {
            if (Array.isArray(string)) string = `[${string}]`;

            throw new Error(`'${string}' is not a string`);
        }

        return true;
    });
};
