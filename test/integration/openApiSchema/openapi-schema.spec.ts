import { expect } from 'chai';
import { Lawbook } from '../../../src/lawbook';
import law from './openapi-schema';

const lawName = 'openapi-schema';

describe(`Law: ${lawName}`, function() {
    beforeEach(async function(this: any) {
        this.book = new Lawbook({
            laws: {
                [lawName]: {
                    required: 'must',
                },
            },
        });
        await law(this.book);
        this.law = this.book.filter(lawName).laws[0];
    });

    describe('Input type validation', function() {
        it('fails when schema = undefined', async function() {
            await expect(this.book.enforce(this.law.name, {}, undefined))
                .to.be.rejectedWith('Expected schema to be an object');
        });

        it('fails when schema = null', async function() {
            await expect(this.book.enforce(this.law.name, {}, null))
                .to.be.rejectedWith('Expected schema to be an object');
        });

        it('fails when json = undefined', async function() {
            await expect(this.book.enforce(this.law.name, undefined, {}))
                .to.be.rejectedWith('Expected json to be an object');
        });

        it('fails when json = null', async function() {
            await expect(this.book.enforce(this.law.name, null, {}))
                .to.be.rejectedWith('Expected json to be an object');
        });

        it('passes when schema is empty', async function() {
            await this.book.enforce(this.law.name, {
                foo: 'bar',
            }, {});
        });

        it('passes when json is empty and the schema does not require', async function() {
            await this.book.enforce(this.law.name, {}, {
                type: 'object',
                properties: {
                    foo: {
                        type: 'string',
                    },
                },
            });
        });
    });

    it('fails when the json does not adhere to the schema', async function() {
        await expect(this.book.enforce(this.law.name, {
            foo: 123,
        }, {
            foo: {
                type: 'string',
            },
        }))
            .to.be.rejectedWith(`'123' is not a string`);
    });

    it('fails when the json does not adhere to the nested schema', async function() {
        await expect(this.book.enforce(this.law.name, {
            foo: {
                bar: '2019-31-02',
            },
        }, {
            foo: {
                type: 'object',
                properties: {
                    bar: {
                        type: 'string',
                        format: 'date',
                    },
                },
            },
        }))
            .to.be.rejectedWith(`'2019-31-02' is not a valid date`);
    });
});
