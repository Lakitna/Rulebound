import { Lawbook } from '../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    const types = [
        'number',
        'integer',
        'string',
        'object',
        'array',
    ];

    return lawbook
        .add('openApiSchema/schema/is-kown-type')
        .define(async function(schema) {
            if (!types.includes(schema.type)) {
                throw new Error(`Unkown type '${schema.type}'. `
                    + `Expected one of [${types.join(', ')}]`);
            }

            return true;
        });
};
