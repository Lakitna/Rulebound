import { isError, isObject } from 'lodash-es';
import { Rulebook } from '../../../src/rulebook';

export interface OasRuleParameters {
    json: Record<string, any>;
    schema: Record<string, any>;
}

export default async (rulebook: Rulebook<OasRuleParameters>) => {
    const subRules = ['schema', 'string'];
    for (const rule of subRules) {
        const module = await import(`./${rule}/index`);
        await module.default(rulebook);
    }

    return rulebook
        .add('openapi-schema')
        .describe(
            `
            JSON schema is at the heart of OpenAPI.

            Note that this is a partial implementation created to test Rulebound.
            `
        )
        .define(async function ({ json, schema }) {
            this.context.trail = [];

            if (!isObject(schema)) {
                throw new TypeError(`Expected schema to be an object`);
            }
            if (!isObject(json)) {
                throw new TypeError(`Expected json to be an object`);
            }

            const recurse = async (json: object, schema: object) => {
                for (const key in schema) {
                    // @ts-expect-error Softly typed OAS object for simplicity sake during testing
                    const subSchema = schema[key];
                    // @ts-expect-error Softly typed OAS object for simplicity sake during testing
                    const subJson = json[key];

                    if (subJson === undefined) {
                        // Finding missing keys is done if we get to this point.
                        // So we'll simply continue to the next key if we
                        // encounter an unset key.
                        continue;
                    }

                    this.context.trail.push(key);

                    // Some basic checks on the schema
                    await rulebook.enforce('openapi-schema/schema/*', {
                        json: {},
                        schema: subSchema,
                    });

                    // Enforce more specific rules
                    await rulebook.enforce(`openapi-schema/${subSchema.type}/*`, {
                        json: subJson,
                        schema: subSchema,
                    });

                    // Go deeper if we can
                    if (subSchema.type === 'object') {
                        await recurse(subJson, subSchema.properties);
                    } else if (subSchema.type === 'array') {
                        for (const [index, jsonItem] of subJson.entries()) {
                            await recurse({ [index]: jsonItem }, { [index]: subSchema.items });
                        }
                    }

                    this.context.trail.pop();
                }
            };
            await recurse(json, schema);

            return true;
        })
        .punishment(function (_input, _config, error) {
            if (isError(error)) {
                error.message +=
                    this.context.trail.length > 0
                        ? `\n@ ${this.context.trail.join(' > ')}`
                        : `\n@ object root`;

                throw error;
            }

            throw new Error('Unexpected non-error returned');
        });
};
