const { Lawbook } = require('lawful');

const formats = [
    'float',
    'double',
];

module.exports = (lawbook) => {
    formats.forEach((format) => {
        require(`./${format}`)(lawbook);
    });

    return lawbook
        .add('openApiSchema/number/format', {
            allowUnkown: false,
            severity: 'should',
        })
        .define(async function(num, schema) {
            if (typeof schema.format === 'undefined') {
                return true;
            }
            else if (formats.includes(schema.format)) {
                await lawbook.enforce(`openApiSchema/number/format/${schema.format}`, num, schema);
            }
            else if (!this.config.allowUnkown) {
                throw new Error(`Unkown format '${schema.format}'. `
                    + `Expected one of [${formats.join(', ')}]`
                    + '\nDisable this check via the config `allowUnkown: true`');
            }

            return true;
        });
};
