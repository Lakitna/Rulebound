import { isUndefined } from 'lodash-es';
import assert from 'node:assert';
import { OasRuleParametersString } from '..';
import { Rulebook } from '../../../../../src/rulebook';

export default async (rulebook: Rulebook<OasRuleParametersString>) => {
    return rulebook
        .add('openapi-schema/string/format/date-time')
        .describe(
            `
            "the date-time notation as defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z"

            https://swagger.io/docs/specification/data-models/data-types/#format
        `
        )
        .define(async function ({ string, schema }) {
            const split = string.split('T');
            assert(split.length == 2);

            const date = split[0];
            let time = split[1];

            try {
                await rulebook.enforce('openapi-schema/string/format/date', {
                    string: date,
                    schema,
                });
            } catch {
                return false;
            }

            const timeZone = time.split('+')[1];
            if (isUndefined(timeZone)) {
                assert(time.endsWith('Z'));
                time = time.replace(/Z$/, '');
            } else {
                const timeZoneSplit = timeZone.split(':');
                assert(timeZoneSplit.length === 2);

                const h = timeZoneSplit[0],
                    m = timeZoneSplit[1];

                assertZeroPaddedTimePartial(h, 24);
                assertZeroPaddedTimePartial(m, 60);

                time = time.split('+')[0];
            }

            const timeSplit = time.split(':');
            assert(timeSplit.length == 3);

            const h = timeSplit[0],
                m = timeSplit[1],
                s = timeSplit[2];

            assertZeroPaddedTimePartial(h, 24);
            assertZeroPaddedTimePartial(m, 60);
            assertZeroPaddedTimePartial(s, 60);

            return true;
        })
        .punishment(function ({ string }) {
            this.throw(`'${string}' is not valid date-time`);
        });
};

function assertZeroPaddedTimePartial(value: string, maximum: number) {
    assert(value.length == 2);

    const numeric = Number(value);
    assert(!Number.isNaN(numeric));
    assert(0 <= numeric && numeric < maximum);
}
