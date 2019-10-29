import { Lawbook } from '../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openApiSchema/string/minLength')
        .describe(`
            "String length can be restricted using \`minLength\` and \`maxLength\`"

            https://swagger.io/docs/specification/data-models/data-types/#string
        `)
        .define(async function(str, schema) {
            if (typeof schema.minLength === 'undefined') {
                return true;
            }

            if (str.length < schema.minLength) {
                throw new Error(`'${str}' is too short. `
                    + `Expected at least ${schema.minLength} characters but got ${str.length}`);
            }

            return true;
        });
};
