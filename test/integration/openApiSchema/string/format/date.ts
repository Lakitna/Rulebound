import assert from 'node:assert';
import { OasRuleParametersString } from '..';
import { Rulebook } from '../../../../../src/rulebook';

export default async (rulebook: Rulebook<OasRuleParametersString>) => {
    return rulebook
        .add('openapi-schema/string/format/date')
        .describe(
            `
            "full-date notation as defined by RFC 3339, section 5.6, for example, 2017-07-21"

            https://swagger.io/docs/specification/data-models/data-types/#format
        `
        )
        .define(function ({ string }) {
            const split = string.split('-');
            assert(split.length == 3);

            const y = split[0];
            const m = split[1];
            const d = split[2];

            // Always 4 characters
            assert(y.length == 4);
            // Always 2 characters
            assert(m.length == 2);
            assert(d.length == 2);

            const ynum = Number(y);
            const mnum = Number(m);
            const dnum = Number(d);

            // Always numbers
            assert(!Number.isNaN(y));
            assert(!Number.isNaN(m));
            assert(!Number.isNaN(d));

            // Always in range
            const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            assert(0 < ynum);
            assert(0 < mnum && mnum <= 12);
            assert(0 < dnum && dnum <= daysPerMonth[mnum - 1]);

            return true;
        })
        .punishment(function ({ string }) {
            this.throw(`'${string}' is not a valid date`);
        });
};
