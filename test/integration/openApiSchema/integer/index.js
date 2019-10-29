module.exports = (lawbook) => {
    require('./format')(lawbook);

    return lawbook
        .add('openApiSchema/integer')
        .define(async function(num, schema) {
            if (typeof num === 'undefined') {
                return true;
            }

            if (typeof num !== 'number' || num % 1 !== 0) {
                throw new Error(`'${num}' is not an integer`);
            }

            await lawbook.enforce('openApiSchema/number/!(format)', num, schema);
            await lawbook.enforce('openApiSchema/integer/*', num, schema);
            return true;
        });
};
