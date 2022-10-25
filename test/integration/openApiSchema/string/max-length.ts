import { isUndefined } from 'lodash-es';
import { Rulebook } from '../../../../src/rulebook';

export default (rulebook: Rulebook) => {
    return rulebook
        .add('openapi-schema/string/max-length')
        .describe(
            `
            "String length can be restricted using \`minLength\` and \`maxLength\`"

            https://swagger.io/docs/specification/data-models/data-types/#string
        `
        )
        .define(async function (string, schema) {
            if (isUndefined(schema.maxLength)) {
                return true;
            }

            if (string.length > schema.maxLength) {
                throw new Error(
                    `'${string}' is too long. ` +
                        `Expected at most ${schema.maxLength} characters but got ${string.length}`
                );
            }

            return true;
        });
};
