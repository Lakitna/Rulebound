import { Lawbook } from '../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openApiSchema/string/enum')
        .describe(`
            "You can use the enum keyword to specify possible values of a request parameter or a model property."

            "All values in an enum must adhere to the specified type."

            https://swagger.io/docs/specification/data-models/enums/
        `)
        .define(async function(str, schema) {
            if (typeof schema.enum === 'undefined') {
                return true;
            }

            if (!Array.isArray(schema.enum)) {
                throw new Error(`Enum must be an array`);
            }

            const types = [...new Set(schema.enum.map((value:string|any) => typeof value))];
            if (types.length > 1) {
                throw new Error(`All values in an enum must be of the same `
                    + `type. Found the distinct types [${types.join(', ')}]`);
            }

            if (!schema.enum.includes(str)) {
                throw new Error(`Unexpected value '${str}'. `
                    + `Expected one of ['${schema.enum.join(`', '`)}']`);
            }

            return true;
        });
};
