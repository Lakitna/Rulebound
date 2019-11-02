import { expect } from 'chai';
import { Lawbook } from '../../../../src/lawbook';
import law from './is-kown-type';

const lawName = 'openapi-schema/schema/is-kown-type';

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

    it('passes on valid type string', async function() {
        await this.book.enforce(this.law.name, {
            type: 'string',
        });
    });

    it('passes on valid type integer', async function() {
        await this.book.enforce(this.law.name, {
            type: 'integer',
        });
    });

    it('passes on valid type number', async function() {
        await this.book.enforce(this.law.name, {
            type: 'number',
        });
    });

    it('passes on valid type object', async function() {
        await this.book.enforce(this.law.name, {
            type: 'object',
        });
    });

    it('passes on valid type array', async function() {
        await this.book.enforce(this.law.name, {
            type: 'array',
        });
    });

    it('fails on type null', async function() {
        await expect(this.book.enforce(this.law.name, {
            type: null,
        })).to.be.rejectedWith(`Unkown type 'null'`);
    });

    it('fails on type undefined', async function() {
        await expect(this.book.enforce(this.law.name, {
            type: undefined,
        })).to.be.rejectedWith(`Unkown type 'undefined'`);
    });

    it('fails on an invalid type', async function() {
        await expect(this.book.enforce(this.law.name, {
            type: 'badType',
        })).to.be.rejectedWith(`Unkown type 'badType'`);
    });
});
