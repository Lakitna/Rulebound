import { isUndefined } from 'lodash';
import { Lawbook } from '../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openApiSchema/string/max-length')
        .describe(`
            "String length can be restricted using \`minLength\` and \`maxLength\`"

            https://swagger.io/docs/specification/data-models/data-types/#string
        `)
        .define(async function(string, schema) {
            if (isUndefined(schema.maxLength)) {
                return true;
            }

            if (string.length > schema.maxLength) {
                throw new Error(`'${string}' is too long. `
                    + `Expected at most ${schema.maxLength} characters but got ${string.length}`);
            }

            return true;
        });
};
