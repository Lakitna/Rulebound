import assert from 'assert';
import { Lawbook } from '../../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openapi-schema/string/format/date')
        .describe(`
            "full-date notation as defined by RFC 3339, section 5.6, for example, 2017-07-21"

            https://swagger.io/docs/specification/data-models/data-types/#format
        `)
        .define(function(string) {
            const split = string.split('-');
            assert(split.length == 3);

            let y = split[0],
                m = split[1],
                d = split[2];

            // Always 4 characters
            assert(y.length == 4);
            // Always 2 characters
            assert(m.length == 2);
            assert(d.length == 2);

            y = Number(y);
            m = Number(m);
            d = Number(d);

            // Always numbers
            assert(!isNaN(y));
            assert(!isNaN(m));
            assert(!isNaN(d));

            // Always in range
            const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            assert(0 < y);
            assert(0 < m && m <= 12);
            assert(0 < d && d <= daysPerMonth[m - 1]);

            return true;
        })
        .punishment(function(inputs) {
            this.throw(`'${inputs[0]}' is not a valid date`);
        });
};
