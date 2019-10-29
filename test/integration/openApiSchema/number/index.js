module.exports = (lawbook) => {
    require('./maximum')(lawbook);
    require('./minimum')(lawbook);
    require('./multipleOf')(lawbook);
    require('./format')(lawbook);
    require('./enum')(lawbook);

    return lawbook
        .add('openApiSchema/number')
        .define(async function(num, schema) {
            if (typeof num === 'undefined') {
                return true;
            }

            if (isNaN(num)) {
                throw new Error(`'${num}' is not a number`)
            }

            await lawbook.enforce('openApiSchema/number/*', num, schema);
            return true;
        });
};
