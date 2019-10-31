import { isUndefined } from 'lodash';
import { Lawbook } from '../../../../../src/lawbook';

export default async (lawbook: Lawbook) => {
    const formats = [
        'binary',
        'date',
        'date-time',
        'password',
    ];

    const lawbookChapter = new Lawbook(lawbook.config.full);
    for (const format of formats) {
        (await import(`./${format}`)).default(lawbookChapter);
    }

    return lawbook
        .add('openapi-schema/string/format', {
            allowUnkown: false,
            severity: 'should',
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
                await lawbookChapter.enforce(`${this.name}/${schema.format}`, string, schema);
            }
            else if (!this.config.allowUnkown) {
                throw new Error(`Unkown format '${schema.format}'. `
                    + `Expected one of [${formats.join(', ')}]`
                    + '\nDisable this check via the config `allowUnkown: true`');
            }

            return true;
        });
};
