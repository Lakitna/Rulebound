module.exports = (lawbook) => {
    require('./unexpectedKey')(lawbook);
    require('./missingKey')(lawbook);
    require('./empty')(lawbook);

    return lawbook
        .add('openApiSchema/object')
        .define(async function(obj, schema) {
            if (typeof obj !== 'object') {
                throw new Error('Input is not an object');
            }

            await lawbook.enforce('openApiSchema/object/*', obj, schema);

            return true;
        });
};
