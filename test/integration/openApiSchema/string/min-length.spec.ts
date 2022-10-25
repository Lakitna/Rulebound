import { expect } from 'chai';
import { Rulebook } from '../../../../src/rulebook';
import rule from './min-length';

const ruleName = 'openapi-schema/string/min-length';

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

    it('passes when there is no minLength in the schema', async function () {
        await this.book.enforce(this.rule.name, 'value', {
            minLength: undefined,
        });
    });

    it('passes when string.length > minLength', async function () {
        await this.book.enforce(this.rule.name, 'value', {
            minLength: 4,
        });
    });

    it('passes when string.length === minLength', async function () {
        await this.book.enforce(this.rule.name, 'value', {
            minLength: 5,
        });
    });

    it('throws when string.length < minLength', async function () {
        await expect(
            this.book.enforce(this.rule.name, 'value', {
                minLength: 6,
            })
        ).to.be.rejectedWith(`'value' is too short. Expected at least 6 characters but got 5`);
    });
});
