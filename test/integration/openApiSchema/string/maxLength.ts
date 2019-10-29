import { Lawbook } from '../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openApiSchema/string/maxLength')
        .describe(`
            "String length can be restricted using \`minLength\` and \`maxLength\`"

            https://swagger.io/docs/specification/data-models/data-types/#string
        `)
        .define(async function(str, schema) {
            if (typeof schema.maxLength === 'undefined') {
                return true;
            }

            if (str.length > schema.maxLength) {
                throw new Error(`'${str}' is too long. `
                    + `Expected at most ${schema.maxLength} characters but got ${str.length}`);
            }

            return true;
        });
};
