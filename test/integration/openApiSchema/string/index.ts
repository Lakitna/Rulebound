import { isString } from 'lodash-es';
import { Rulebook } from '../../../../src/rulebook';

export default async (rulebook: Rulebook) => {
    const subRules = ['format', 'not-empty', 'max-length', 'min-length', 'pattern', 'enum'];

    for (const rule of subRules) {
        const module = await import(`./${rule}`);
        await module.default(rulebook);
    }

    return rulebook.add('openapi-schema/string/type').define(async function (string) {
        if (!isString(string)) {
            if (Array.isArray(string)) string = `[${string}]`;

            throw new Error(`'${string}' is not a string`);
        }

        return true;
    });
};
