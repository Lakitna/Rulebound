import { expect } from 'chai';
import { Rulebook } from '../../../src/rulebook';
import rule, { OasRuleParameters } from './openapi-schema';

const ruleName = 'openapi-schema';

describe(`Rule: ${ruleName}`, function () {
    beforeEach(async function () {
        this.book = new Rulebook<OasRuleParameters>({
            rules: {
                [ruleName]: {
                    required: 'must',
                },
            },
        });
        await rule(this.book);
        this.rule = this.book.filter(ruleName).rules[0];
    });

    describe('Input type validation', function () {
        it('fails when schema = undefined', async function () {
            await expect(
                this.book.enforce(this.rule.name, { json: {}, schema: undefined })
            ).to.be.rejectedWith('Expected schema to be an object');
        });

        it('fails when schema = null', async function () {
            await expect(
                this.book.enforce(this.rule.name, { json: {}, schema: null })
            ).to.be.rejectedWith('Expected schema to be an object');
        });

        it('fails when json = undefined', async function () {
            await expect(
                this.book.enforce(this.rule.name, { json: undefined, schema: {} })
            ).to.be.rejectedWith('Expected json to be an object');
        });

        it('fails when json = null', async function () {
            await expect(
                this.book.enforce(this.rule.name, { json: null, schema: {} })
            ).to.be.rejectedWith('Expected json to be an object');
        });

        it('passes when schema is empty', async function () {
            await this.book.enforce(this.rule.name, {
                json: {
                    foo: 'bar',
                },
                schema: {},
            });
        });

        it('passes when json is empty and the schema does not require', async function () {
            await this.book.enforce(this.rule.name, {
                json: {},
                schema: {
                    type: 'object',
                    properties: {
                        foo: {
                            type: 'string',
                        },
                    },
                },
            });
        });
    });

    it('fails when the json does not adhere to the schema', async function () {
        await expect(
            this.book.enforce(this.rule.name, {
                json: {
                    foo: 123,
                },
                schema: {
                    foo: {
                        type: 'string',
                    },
                },
            })
        ).to.be.rejectedWith(`'123' is not a string`);
    });

    it('fails when the json does not adhere to the nested schema', async function () {
        await expect(
            this.book.enforce(this.rule.name, {
                json: {
                    foo: {
                        bar: '2019-31-02',
                    },
                },
                schema: {
                    foo: {
                        type: 'object',
                        properties: {
                            bar: {
                                type: 'string',
                                format: 'date',
                            },
                        },
                    },
                },
            })
        ).to.be.rejectedWith(`'2019-31-02' is not a valid date`);
    });
});
