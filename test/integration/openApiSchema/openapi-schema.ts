import { isObject } from 'lodash';
import { Lawbook } from '../../../src/lawbook';

export default async (lawbook: Lawbook) => {
    const subLaws = [
        'schema',
        'string',
    ];
    for (const law of subLaws) {
        await (await import(`./${law}/index`)).default(lawbook);
    }

    return lawbook
        .add('openapi-schema')
        .describe(`
            JSON schema is at the heart of OpenAPI.

            Note that this is a partial implementation created to test Lawful.
        `)
        .define(async function(json, schema) {
            this.context.trail = [];

            if (!isObject(schema)) {
                throw new TypeError(`Expected schema to be an object`);
            }
            if (!isObject(json)) {
                throw new TypeError(`Expected json to be an object`);
            }

            const recurse = async (json: object, schema: object) => {
                for (const key in schema) {
                    const subSchema = schema[key];
                    const subJson = json[key];

                    if (subJson === undefined) {
                        // Finding missing keys is done if we get to this point.
                        // So we'll simply continue to the next key if we
                        // encounter an unset key.
                        continue;
                    }

                    this.context.trail.push(key);

                    // Some basic checks on the schema
                    await lawbook.enforce('openapi-schema/schema/*', subSchema);

                    // Enforce more specific rules
                    await lawbook.enforce(
                        `openapi-schema/${subSchema.type}/*`,
                        subJson,
                        subSchema);

                    // Go deeper if we can
                    if (subSchema.type === 'object') {
                        await recurse(subJson, subSchema.properties);
                    }
                    else if (subSchema.type === 'array') {
                        for (const [index, jsonItem] of subJson.entries()) {
                            await recurse(
                                {[index]: jsonItem},
                                {[index]: subSchema.items});
                        }
                    }

                    this.context.trail.pop();
                }
            };
            await recurse(json, schema);

            return true;
        })
        .punishment(function (input, error) {
            if (this.context.trail.length > 0) {
                error.message += `\n@ ${this.context.trail.join(' > ')}`;
            }
            else {
                error.message += `\n@ object root`
            }

            throw error;
        });
};
