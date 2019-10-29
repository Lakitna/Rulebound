module.exports = (lawbook) => {
    require('./empty')(lawbook);

    return lawbook
        .add('openApiSchema/array')
        .define(async function(arr, schema, trail) {
            if (typeof arr === 'undefined') {
                return true;
            }

            if (!Array.isArray(arr)) {
                throw new Error('Input is not an array');
            }

            await lawbook.enforce('openApiSchema/array/*', arr, schema, trail);

            return true;
        });
};
