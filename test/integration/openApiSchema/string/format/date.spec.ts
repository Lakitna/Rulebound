import { expect } from 'chai';
import { OasRuleParametersString } from '..';
import { Rulebook } from '../../../../../src/rulebook';
import rule from './date';

const ruleName = 'openapi-schema/string/format/date';

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
        this.rule = this.book.filter(ruleName).rules[0];
    });

    it('passes when the string is a valid date', async function () {
        await this.book.enforce(this.rule.name, { string: '2017-07-21' });
    });

    it('fails when the string is a valid date-time', async function () {
        await expect(
            this.book.enforce(this.rule.name, { string: '2017-07-21T11:22:33Z' })
        ).to.be.rejectedWith('is not a valid date');
    });

    it('fails when the date is in the wrong order', async function () {
        await expect(
            this.book.enforce(this.rule.name, { string: '21-07-2019' })
        ).to.be.rejectedWith('is not a valid date');

        await expect(
            this.book.enforce(this.rule.name, { string: '2019-21-07' })
        ).to.be.rejectedWith('is not a valid date');
    });

    it('fails when the date does not pad zeros', async function () {
        await expect(this.book.enforce(this.rule.name, { string: '2019-7-21' })).to.be.rejectedWith(
            'is not a valid date'
        );
    });

    it('fails when the date contains letters', async function () {
        await expect(
            this.book.enforce(this.rule.name, { string: '2o19-07-21' })
        ).to.be.rejectedWith('is not a valid date');
    });

    it('fails when the number of days that month are imposible', async function () {
        await expect(
            this.book.enforce(this.rule.name, { string: '2019-02-31' })
        ).to.be.rejectedWith('is not a valid date');
    });
});
