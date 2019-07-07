import * as sinon from 'sinon';
import * as _ from 'lodash';

import { Lawbook } from '../src/lawbook';
import { expect } from 'chai';
import { Law } from '../src/law';
import { lawbookConfigDefault } from '../src/config/defaults';


describe('The class Lawbook', function() {
    it('initializes', function() {
        const lawBook = new Lawbook();

        expect(lawBook).to.be.instanceOf(Lawbook);
        expect(lawBook.laws).to.be.lengthOf(0);
        expect(lawBook.config.full).to.deep.equal(lawbookConfigDefault);
    });

    describe('forEach', function() {
        beforeEach(function() {
            this.lawBook = new Lawbook(lawbookConfigDefault);

            this.lawBook.laws = [
                'foo',
                'bar',
                'baz',
            ];
        });

        it('loops over all laws in the set', function() {
            const fake = sinon.fake();

            this.lawBook.forEach(fake);

            expect(fake.callCount).to.equal(3);
            expect(fake.lastCall.calledWith('baz', 2)).to.be.true;
        });
    });

    describe('add', function() {
        beforeEach(function() {
            this.lawBook = new Lawbook(lawbookConfigDefault);
        });

        it('creates a new law when called with a string', function() {
            this.lawBook.add('foo');

            expect(this.lawBook.laws).to.be.lengthOf(1);
            expect(this.lawBook.laws[0]).to.be.instanceOf(Law);
            expect(this.lawBook.laws[0].name).to.equal('foo');
        });

        it('creates a new law with default config', function() {
            const config = { configSet: true };

            this.lawBook.add('foo', config);

            expect(this.lawBook.laws).to.be.lengthOf(1);
            expect(this.lawBook.laws[0]).to.be.instanceOf(Law);
            expect(this.lawBook.laws[0].config.configSet).to.equal(true);
        });

        it('creates adds the law when called with a Law', function() {
            this.lawBook.add(new Law('foo', this.lawBook));

            expect(this.lawBook.laws).to.be.lengthOf(1);
            expect(this.lawBook.laws[0]).to.be.instanceOf(Law);
            expect(this.lawBook.laws[0].name).to.equal('foo');
        });

        it('throws an error when the law name is a Glob pattern', function() {
            expect(this.lawBook.add.bind(this.lawBook, 'foo-*'))
                .to.throw('Can\'t add a law with a Glob pattern for its name');
        });

        it('throws an error when the same law is added twice', function() {
            this.lawBook.add('foo');

            expect(this.lawBook.add.bind(this.lawBook, 'foo'))
                .to.throw('The law named \'foo\' already exists in the set');
        });

        it('sets the law specific config from the lawBook config', function() {
            const config = {
                laws: {
                    foo: { bar: 'fizz' },
                },
            };
            this.lawBook.config.set(config);
            this.lawBook.add('foo');

            expect(this.lawBook.laws[0].config.bar).to.equal('fizz');
        });
    });

    describe('omit', function() {
        beforeEach(function() {
            this.lawBook = new Lawbook(lawbookConfigDefault);

            this.lawBook.add('fizz');
            this.lawBook.add('buzz');
            this.lawBook.add('fizzbuzz');
        });

        it('returns a new set not containing the exact law by name', function() {
            const newSet = this.lawBook.omit('fizz');

            expect(this.lawBook).to.not.equal(newSet);
            expect(this.lawBook.config.full).to.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(2);
            expect(newSet.laws[0].name).to.equal('buzz');
            expect(newSet.laws[1].name).to.equal('fizzbuzz');
        });

        it('returns a new set not containing the multiple laws by name pattern', function() {
            const newSet = this.lawBook.omit('fizz*');

            expect(this.lawBook).to.not.equal(newSet);
            expect(this.lawBook.config.full).to.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(1);
            expect(newSet.laws[0].name).to.equal('buzz');
        });

        it('returns a full copy of the set when the name pattern does not match any law', function() {
            const newSet = this.lawBook.omit('foo');

            expect(this.lawBook).to.not.equal(newSet);
            expect(this.lawBook.config.full).to.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(3);
        });
    });

    describe('has', function() {
        beforeEach(function() {
            this.lawBook = new Lawbook(lawbookConfigDefault);

            this.lawBook.add('fizz');
            this.lawBook.add('buzz');
            this.lawBook.add('fizzbuzz');
        });

        it('returns true if the set contains the exact law name', function() {
            expect(this.lawBook.has('fizz')).to.be.true;
        });

        it('returns false if the set does not contain the exact law name', function() {
            expect(this.lawBook.has('foo')).to.be.false;
        });

        it('returns true if the set contains the law name pattern', function() {
            expect(this.lawBook.has('fizz*')).to.be.true;
        });

        it('returns false if the set does not contain the law name pattern', function() {
            expect(this.lawBook.has('foo*')).to.be.false;
        });
    });

    describe('filter', function() {
        beforeEach(function() {
            this.lawBook = new Lawbook(lawbookConfigDefault);

            this.lawBook.add('fizz');
            this.lawBook.add('buzz');
            this.lawBook.add('fizzbuzz');
        });

        it('returns a new set only containing the exact law by name', function() {
            const newSet = this.lawBook.filter('fizz');

            expect(this.lawBook).to.not.equal(newSet);
            expect(this.lawBook.config.full).to.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(1);
            expect(newSet.laws[0].name).to.equal('fizz');
        });

        it('returns a new set only containing the multiple laws by name pattern', function() {
            const newSet = this.lawBook.filter('fizz*');

            expect(this.lawBook).to.not.equal(newSet);
            expect(this.lawBook.config.full).to.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(2);
            expect(newSet.laws[0].name).to.equal('fizz');
            expect(newSet.laws[1].name).to.equal('fizzbuzz');
        });

        it('returns a new empty set when the name pattern does not match any law', function() {
            const newSet = this.lawBook.filter('foo');

            expect(this.lawBook).to.not.equal(newSet);
            expect(this.lawBook.config.full).to.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(0);
        });
    });

    describe('enforce', function() {
        beforeEach(function() {
            this.lawBook = new Lawbook(lawbookConfigDefault);
        });

        it('logs a warning when there are no laws in the set', async function() {
            const logStub = sinon.stub(this.lawBook.log, 'warn');

            await this.lawBook.enforce('foo');

            expect(logStub.callCount).to.equal(1);
            expect(logStub.getCall(0).lastArg)
                .to.equal('No laws to enforce. Book is empty');

            logStub.restore();
        });

        it('logs a warning when no laws match the law name pattern', async function() {
            const logStub = sinon.stub(this.lawBook.log, 'warn');

            this.lawBook.add('fizz');
            await this.lawBook.enforce('untraceable');

            expect(logStub.callCount).to.equal(1);
            expect(logStub.getCall(0).lastArg)
                .to.equal(`No laws to enforce for name pattern 'untraceable'`);

            logStub.restore();
        });

        it('enforces all laws in ascending order of specificity', async function() {
            let order = 0;

            this.lawBook.add('fizz-bar-buzz')
                .define(() => {
                    order++;
                    expect(order).to.equal(3);
                    return true;
                });

            this.lawBook.add('fizz')
                .define(() => {
                    order++;
                    expect(order).to.equal(1);
                    return true;
                });

            this.lawBook.add('fizz-buzz')
                .define(() => {
                    order++;
                    expect(order).to.equal(2);
                    return true;
                });


            await this.lawBook.enforce('fizz*');
            expect(order).to.equal(3);
        });
    });
});
