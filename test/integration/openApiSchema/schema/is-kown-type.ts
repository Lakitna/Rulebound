import { Rulebook } from '../../../../src/rulebook';

export default (rulebook: Rulebook) => {
    const types = ['number', 'integer', 'string', 'object', 'array'];

    return rulebook.add('openapi-schema/schema/is-kown-type').define(async function (schema) {
        if (!types.includes(schema.type)) {
            throw new Error(
                `Unkown type '${schema.type}'. ` + `Expected one of [${types.join(', ')}]`
            );
        }

        return true;
    });
};
