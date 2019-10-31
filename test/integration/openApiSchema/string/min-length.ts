import { isUndefined } from 'lodash';
import { Lawbook } from '../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openapi-schema/string/min-length')
        .describe(`
            "String length can be restricted using \`minLength\` and \`maxLength\`"

            https://swagger.io/docs/specification/data-models/data-types/#string
        `)
        .define(async function(string, schema) {
            if (isUndefined(schema.minLength)) {
                return true;
            }

            if (string.length < schema.minLength) {
                throw new Error(`'${string}' is too short. `
                    + `Expected at least ${schema.minLength} characters but got ${string.length}`);
            }

            return true;
        });
};
