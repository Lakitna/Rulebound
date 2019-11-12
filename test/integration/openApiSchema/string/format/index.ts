import { isUndefined } from 'lodash';
import { Rulebook } from '../../../../../src/rulebook';

export default async (rulebook: Rulebook) => {
    const formats = [
        'date',
        'date-time',
    ];

    const rulebookChapter = new Rulebook(rulebook.config.full);
    for (const format of formats) {
        (await import(`./${format}`)).default(rulebookChapter);
    }

    return rulebook
        .add('openapi-schema/string/format', {
            allowUnkown: false,
            required: 'should',
        })
        .describe(`
            "An optional \`format\` modifier serves as a hint at the contents and format of the string."

            "Tools that do not support a specific format may default back to the \`type\` alone, as if the \`format\` is not specified."

            https://swagger.io/docs/specification/data-models/data-types/#format
        `)
        .define(async function(string, schema) {
            if (isUndefined(schema.format)) {
                // No format, nothing to test
                return true;
            }
            else if (formats.includes(schema.format)) {
                await rulebookChapter.enforce(`${this.name}/${schema.format}`, string, schema);
            }
            else if (!this.config.allowUnkown) {
                throw new Error(`Unkown format '${schema.format}'. `
                    + `Expected one of [${formats.join(', ')}]`
                    + '\nDisable this check via the config `allowUnkown: true`');
            }

            return true;
        });
};
