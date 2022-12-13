import { expect } from 'chai';
import { OasRuleParametersString } from '.';
import { Rulebook } from '../../../../src/rulebook';
import rule from './not-empty';

const ruleName = 'openapi-schema/string/not-empty';

describe(`Rule: ${ruleName}`, function () {
    beforeEach(async function (this: any) {
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

    it('passes on valid string', async function () {
        await this.book.enforce(this.rule.name, { string: 'foo' });
    });

    it('passes a string starting with whitespace', async function () {
        await this.book.enforce(this.rule.name, { string: ' foo' });
    });

    it('passes a string ending with whitespace', async function () {
        await this.book.enforce(this.rule.name, { string: 'foo ' });
    });

    it('throws on empty string without whitespace', async function () {
        await expect(this.book.enforce(this.rule.name, { string: '' })).to.be.rejectedWith(
            `String is empty. Empty strings should be omitted.`
        );
    });

    it('throws on empty string with single space', async function () {
        await expect(this.book.enforce(this.rule.name, { string: ' ' })).to.be.rejectedWith(
            `String is empty. Empty strings should be omitted.`
        );
    });

    it('throws on empty string with complex whitespace', async function () {
        await expect(
            this.book.enforce(this.rule.name, { string: '  \t \n  \t\t' })
        ).to.be.rejectedWith(`String is empty. Empty strings should be omitted.`);
    });
});
