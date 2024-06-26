import { expect } from 'chai';
import { Rulebook } from '../../../../src/rulebook';
import rule from './is-kown-type';

const ruleName = 'openapi-schema/schema/is-kown-type';

describe(`Rule: ${ruleName}`, function () {
    beforeEach(async function () {
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

    it('passes on valid type string', async function () {
        await this.book.enforce(this.rule.name, {
            schema: {
                type: 'string',
            },
        });
    });

    it('passes on valid type integer', async function () {
        await this.book.enforce(this.rule.name, {
            schema: {
                type: 'integer',
            },
        });
    });

    it('passes on valid type number', async function () {
        await this.book.enforce(this.rule.name, {
            schema: {
                type: 'number',
            },
        });
    });

    it('passes on valid type object', async function () {
        await this.book.enforce(this.rule.name, {
            schema: {
                type: 'object',
            },
        });
    });

    it('passes on valid type array', async function () {
        await this.book.enforce(this.rule.name, {
            schema: {
                type: 'array',
            },
        });
    });

    it('fails on type null', async function () {
        await expect(
            this.book.enforce(this.rule.name, {
                schema: {
                    type: null,
                },
            })
        ).to.be.rejectedWith(`Unkown type 'null'`);
    });

    it('fails on type undefined', async function () {
        await expect(
            this.book.enforce(this.rule.name, {
                schema: {
                    type: undefined,
                },
            })
        ).to.be.rejectedWith(`Unkown type 'undefined'`);
    });

    it('fails on an invalid type', async function () {
        await expect(
            this.book.enforce(this.rule.name, {
                schema: {
                    type: 'badType',
                },
            })
        ).to.be.rejectedWith(`Unkown type 'badType'`);
    });
});
