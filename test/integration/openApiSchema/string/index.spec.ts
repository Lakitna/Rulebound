import { expect } from 'chai';
import { Rulebook } from '../../../../src/rulebook';
import rule from '.';

const ruleName = 'openapi-schema/string/type';

describe(`Rule: ${ruleName}`, function() {
    beforeEach(async function(this: any) {
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

    it('passes on valid string', async function() {
        await this.book.enforce(this.rule.name, 'fooBar');
    });

    it('fails on null', async function() {
        await expect(this.book.enforce(this.rule.name, null))
            .to.be.rejectedWith(`'null' is not a string`);
    });

    it('fails on undefined', async function() {
        await expect(this.book.enforce(this.rule.name, undefined))
            .to.be.rejectedWith(`'undefined' is not a string`);
    });

    it('fails on a number', async function() {
        await expect(this.book.enforce(this.rule.name, 123))
            .to.be.rejectedWith(`'123' is not a string`);
    });

    it('fails on an array', async function() {
        await expect(this.book.enforce(this.rule.name, ['foo']))
            .to.be.rejectedWith(`'[foo]' is not a string`);
    });

    it('fails on an object', async function() {
        await expect(this.book.enforce(this.rule.name, {foo:'bar'}))
            .to.be.rejectedWith(`'[object Object]' is not a string`);
    });
});
