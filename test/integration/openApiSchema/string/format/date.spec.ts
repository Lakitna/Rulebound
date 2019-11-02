import { expect } from 'chai';
import { Lawbook } from '../../../../../src/lawbook';
import law from './date';

const lawName = 'openapi-schema/string/format/date';

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

    it('passes when the string is a valid date', async function() {
        await this.book.enforce(this.law.name, '2017-07-21');
    });

    it('fails when the string is a valid date-time', async function() {
        await expect(this.book.enforce(this.law.name, '2017-07-21T11:22:33Z'))
            .to.be.rejectedWith('is not a valid date');
    });

    it('fails when the date is in the wrong order', async function() {
        await expect(this.book.enforce(this.law.name, '21-07-2019'))
            .to.be.rejectedWith('is not a valid date');

        await expect(this.book.enforce(this.law.name, '2019-21-07'))
            .to.be.rejectedWith('is not a valid date');
    });

    it('fails when the date does not pad zeros', async function() {
        await expect(this.book.enforce(this.law.name, '2019-7-21'))
            .to.be.rejectedWith('is not a valid date');
    });

    it('fails when the date contains letters', async function() {
        await expect(this.book.enforce(this.law.name, '2o19-07-21'))
            .to.be.rejectedWith('is not a valid date');
    });

    it('fails when the number of days that month are imposible', async function() {
        await expect(this.book.enforce(this.law.name, '2019-02-31'))
            .to.be.rejectedWith('is not a valid date');
    });
});
