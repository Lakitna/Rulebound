import { isString } from 'lodash';
import { Lawbook } from '../../../../src/lawbook';

export default async (lawbook: Lawbook) => {
    const subLaws = [
        // 'format',
        'not-empty',
        'max-length',
        'min-length',
        'pattern',
        'enum',
    ];

    for (const law of subLaws) {
        (await import(`./${law}`)).default(lawbook);
    }

    return lawbook
        .add('openapi-schema/string')
        .define(async function(string) {
            if (!isString(string)) {
                if (Array.isArray(string)) string = `[${string}]`;

                throw new Error(`'${string}' is not a string`);
            }

            return true;
        });
};
