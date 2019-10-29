import assert from 'assert';
import { Lawbook } from '../../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openApiSchema/string/format/date-time')
        .describe(`
            "the date-time notation as defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z"

            https://swagger.io/docs/specification/data-models/data-types/#format
        `)
        .define(async function(string) {
            const split = string.split('T');
            assert(split.length == 2);

            const date = split[0];
            let time = split[1];

            try {
                await this.lawbook.enforce('openApiSchema/string/format/date', date);
            }
            catch (error) {
                return false;
            }

            assert(time.endsWith('Z'));
            time = time.replace(/Z$/, '');

            const timeSplit = time.split(':');
            assert(timeSplit.length == 3);

            let h = timeSplit[0],
                m = timeSplit[1],
                s = timeSplit[2];

            // Always 2 characters
            assert(h.length == 2);
            assert(m.length == 2);
            assert(s.length == 2);

            h = Number(h);
            m = Number(m);
            s = Number(s);

            // Always numbers
            assert(!isNaN(h));
            assert(!isNaN(m));
            assert(!isNaN(s));

            // Always in range
            assert(0 <= h && h < 24);
            assert(0 <= m && m < 60);
            assert(0 <= s && s < 60);

            return true;
        })
        .punishment(function(inputs) {
            this.throw(`'${inputs[0]}' is not valid date-time`);
        });
};
