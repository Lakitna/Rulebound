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
        .add('openApiSchema')
        .describe(`
            JSON schema is at the heart of OpenAPI.
        `)
        .define(async function(json, schema) {
            if (typeof schema !== 'object') {
                throw new Error(`Expected schema to be an object`);
            }
            if (typeof json !== 'object') {
                throw new Error(`Expected json to be an object`);
            }

            // Enforce object rules on root
            // await lawbook.enforce(
            //     `openApiSchema/object`,
            //     json,
            //     {properties: schema},
            //     []);

            const recurse = async (json: object, schema: object, trail: string[]) => {
                for (let key in schema) {
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
                    await lawbook.enforce('openApiSchema/schema/**', subSchema);

                    // Enforce more specific rules
                    // await lawbook.enforce(
                    //     `openApiSchema/${subSchema.type}`,
                    //     subJson,
                    //     subSchema,
                    //     trail);

                    // Go deeper if we can
                    if (subSchema.type === 'object') {
                        await recurse(subJson, subSchema.properties, trail);
                    }
                    else if (subSchema.type === 'array') {
                        for (let i=0; i<subJson.length; i++) {
                            await recurse({[i]: subJson[i]}, {[i]: subSchema.items}, trail);
                        }
                    }

                    trail.pop();
                }
            };
            await recurse(json, schema, []);

            return true;
        })
        .punishment(function (input, err) {
            // if (this.trail.length) {
            //     err.message += `\n@ ${this.trail.join(' > ')}`;
            // }
            // else {
            //     err.message += `\n@ object root`
            // }

            throw err;
        });
};
