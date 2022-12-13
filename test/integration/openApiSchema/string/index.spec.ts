import { expect } from 'chai';
import rule, { OasRuleParametersString } from '.';
import { Rulebook } from '../../../../src/rulebook';

const ruleName = 'openapi-schema/string/type';

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

    it('passes on valid string', async function () {
        await this.book.enforce(this.rule.name, { json: 'fooBar' });
    });

    it('fails on null', async function () {
        await expect(this.book.enforce(this.rule.name, { json: null })).to.be.rejectedWith(
            `'null' is not a string`
        );
    });

    it('fails on undefined', async function () {
        await expect(this.book.enforce(this.rule.name, { json: undefined })).to.be.rejectedWith(
            `'undefined' is not a string`
        );
    });

    it('fails on a number', async function () {
        await expect(this.book.enforce(this.rule.name, { json: 123 })).to.be.rejectedWith(
            `'123' is not a string`
        );
    });

    it('fails on an array', async function () {
        await expect(this.book.enforce(this.rule.name, { json: ['foo'] })).to.be.rejectedWith(
            `'[foo]' is not a string`
        );
    });

    it('fails on an object', async function () {
        await expect(
            this.book.enforce(this.rule.name, { json: { foo: 'bar' } })
        ).to.be.rejectedWith(`'[object Object]' is not a string`);
    });
});
