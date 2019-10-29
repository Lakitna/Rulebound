import { Lawbook } from '../../../../src/lawbook';

export default async (lawbook: Lawbook) => {
    const subLaws = [
        // 'format',
        'not-empty',
        'maxLength',
        'minLength',
        'pattern',
        'enum',
    ];

    for (const law of subLaws) {
        (await import(`./${law}`)).default(lawbook);
    }

    return lawbook
        .add('openApiSchema/string')
        .define(async function(str, schema) {
            if (typeof str !== 'string') {
                if (Array.isArray(str)) str = `[${str}]`;

                throw new Error(`'${str}' is not a string`);
            }

            return true;
        });
};
