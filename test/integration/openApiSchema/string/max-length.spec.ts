import { expect } from 'chai';
import { Rulebook } from '../../../../src/rulebook';
import rule from './max-length';

const ruleName = 'openapi-schema/string/max-length';

describe(`Rule: ${ruleName}`, function () {
    beforeEach(async function (this: any) {
        this.book = new Rulebook({
            rules: {
                [ruleName]: {
                    required: 'must',
                },
            },
        });
        await rule(this.book);
        this.rule = this.book.filter(ruleName).rules[0];
    });

    it('passes when there is no maxLength in the schema', async function () {
        await this.book.enforce(this.rule.name, 'value', {
            maxLength: undefined,
        });
    });

    it('passes when string.length < maxLength', async function () {
        await this.book.enforce(this.rule.name, 'value', {
            maxLength: 6,
        });
    });

    it('passes when string.length === maxLength', async function () {
        await this.book.enforce(this.rule.name, 'value', {
            maxLength: 5,
        });
    });

    it('throws when string.length > maxLength', async function () {
        await expect(
            this.book.enforce(this.rule.name, 'value', {
                maxLength: 4,
            })
        ).to.be.rejectedWith(`'value' is too long. Expected at most 4 characters but got 5`);
    });
});
