import { isObject } from 'lodash';
import { Lawbook } from '../../../src/lawbook';

export default async (lawbook: Lawbook) => {
    const subLaws = [
        'schema',
        // 'array',
        // 'integer',
        // 'number',
        // 'object',
        'string',
    ];
    for (const law of subLaws) {
        (await import(`./${law}/index`)).default(lawbook);
    }

    return lawbook
        .add('openapi-schema')
        .describe(`
            JSON schema is at the heart of OpenAPI.
        `)
        .define(async function(json, schema) {
            if (!isObject(schema)) {
                throw new TypeError(`Expected schema to be an object`);
            }
            if (!isObject(json)) {
                throw new TypeError(`Expected json to be an object`);
            }

            // Enforce object rules on root
            // await lawbook.enforce(
            //     `openapi-schema/object`,
            //     json,
            //     {properties: schema},
            //     []);

            const recurse = async (json: object, schema: object, trail: string[]) => {
                for (const key in schema) {
                    const subSchema = schema[key];
                    const subJson = json[key];

                    if (subJson === undefined) {
                        // Finding missing keys is done if we get to this point.
                        // So we'll simply continue to the next key if we
                        // encounter an unset key.
                        continue;
                    }

                    trail.push(key);

                    // Some basic checks on the schema
                    await lawbook.enforce('openapi-schema/schema/**', subSchema);

                    // Enforce more specific rules
                    // await lawbook.enforce(
                    //     `openapi-schema/${subSchema.type}`,
                    //     subJson,
                    //     subSchema,
                    //     trail);

                    // Go deeper if we can
                    if (subSchema.type === 'object') {
                        await recurse(subJson, subSchema.properties, trail);
                    }
                    else if (subSchema.type === 'array') {
                        for (const [index, jsonItem] of subJson.entries()) {
                            await recurse(
                                {[index]: jsonItem},
                                {[index]: subSchema.items},
                                trail);
                        }
                    }

                    trail.pop();
                }
            };
            await recurse(json, schema, []);

            return true;
        })
        .punishment(function (input, error) {
            // if (this.trail.length) {
            //     error.message += `\n@ ${this.trail.join(' > ')}`;
            // }
            // else {
            //     error.message += `\n@ object root`
            // }

            throw error;
        });
};
