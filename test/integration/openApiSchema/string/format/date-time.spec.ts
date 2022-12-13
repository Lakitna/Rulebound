import { expect } from 'chai';
import { OasRuleParametersString } from '..';
import { Rulebook } from '../../../../../src/rulebook';
import openapiSchemaStringFormatDate from './date';
import rule from './date-time';

const ruleName = 'openapi-schema/string/format/date-time';

describe(`Rule: ${ruleName}`, function () {
    beforeEach(async function () {
        this.book = new Rulebook<OasRuleParametersString>({
            rules: {
                [ruleName]: {
                    required: 'must',
                },
            },
        });
        await rule(this.book);

        // `openapi-schema/string/format/date` is used to validate the date
        // part of the date-time.
        await openapiSchemaStringFormatDate(this.book);
        this.rule = this.book.filter(ruleName).rules[0];
    });

    it('passes when the string is a valid date-time with timezone Z', async function () {
        await this.book.enforce(this.rule.name, { string: '2017-07-21T11:22:33Z' });
    });

    it('passes when the string is a valid date-time with explicit timezone', async function () {
        await this.book.enforce(this.rule.name, { string: '2017-07-21T11:22:33+01:00' });
    });

    it('fails when the string is a valid date', async function () {
        await expect(
            this.book.enforce(this.rule.name, { string: '2017-07-21' })
        ).to.be.rejectedWith('is not valid date-time');
    });

    it('fails when the there is no timezone', async function () {
        await expect(
            this.book.enforce(this.rule.name, { string: '2017-07-21T11:22:33' })
        ).to.be.rejectedWith('is not valid date-time');
    });

    it('fails when the date is invalid', async function () {
        await expect(
            this.book.enforce(this.rule.name, { string: '2017-21-07T11:22:33Z' })
        ).to.be.rejectedWith('is not valid date-time');
    });

    it('fails when the time is invalid', async function () {
        await expect(
            this.book.enforce(this.rule.name, { string: '2017-07-21T30:22:33Z' })
        ).to.be.rejectedWith('is not valid date-time');
    });
});
