import sinon from 'sinon';

import { expect } from 'chai';
import { rulebookConfigDefault } from '../../src/config/defaults';
import { Rule } from '../../src/rule';
import { Rulebook } from '../../src/rulebook';

describe('The class Rulebook', function () {
    it('initializes', function () {
        const ruleBook = new Rulebook();

        expect(ruleBook).to.be.instanceOf(Rulebook);
        expect(ruleBook.rules).to.be.lengthOf(0);
        expect(ruleBook.config.full).to.deep.equal(rulebookConfigDefault);
    });

    describe('forEach', function () {
        beforeEach(function () {
            this.ruleBook = new Rulebook(rulebookConfigDefault);

            this.ruleBook.rules = ['foo', 'bar', 'baz'];
        });

        it('loops over all rules in the set', function () {
            const fake = sinon.fake();

            // eslint-disable-next-line unicorn/no-array-callback-reference
            this.ruleBook.forEach(fake);

            expect(fake.callCount).to.equal(3);
            expect(fake.lastCall.calledWith('baz', 2)).to.be.true;
        });
    });

    describe('iterable', function () {
        beforeEach(function () {
            this.ruleBook = new Rulebook(rulebookConfigDefault);

            this.ruleBook.rules = ['foo', 'bar', 'baz'];
        });

        it('iterates over all rules in the set', function () {
            const fake = sinon.fake();

            for (const rule of this.ruleBook) {
                fake(rule);
            }

            expect(fake.callCount).to.equal(3);
            expect(fake.lastCall.calledWith('baz')).to.be.true;
        });
    });

    describe('sortRules', function () {
        beforeEach(function () {
            this.ruleBook = new Rulebook(rulebookConfigDefault);
        });

        it('orders the rules by specificity', function () {
            this.ruleBook.add('foo');
            this.ruleBook.add('foo-bar-lor');
            this.ruleBook.add('foo-bar/xxx-aaa');
            this.ruleBook.add('foo-bar');
            this.ruleBook.add('bar-oof/foo');
            this.ruleBook.add('bar-oof');

            this.ruleBook.sortRules();

            expect(this.ruleBook.rules.map((rule: Rule) => rule.name)).to.deep.equal([
                'bar-oof',
                'foo',
                'foo-bar',
                'foo-bar-lor',
                'bar-oof/foo',
                'foo-bar/xxx-aaa',
            ]);
        });
    });

    describe('add', function () {
        beforeEach(function () {
            this.ruleBook = new Rulebook(rulebookConfigDefault);
        });

        it('creates a new rule when called with a string', function () {
            this.ruleBook.add('foo');

            expect(this.ruleBook.rules).to.be.lengthOf(1);
            expect(this.ruleBook.rules[0]).to.be.instanceOf(Rule);
            expect(this.ruleBook.rules[0].name).to.equal('foo');
        });

        it('creates a new rule when called with a function resolving to a string', function () {
            this.ruleBook.add(() => {
                return 'foo';
            });

            expect(this.ruleBook.rules).to.be.lengthOf(1);
            expect(this.ruleBook.rules[0]).to.be.instanceOf(Rule);
            expect(this.ruleBook.rules[0].name).to.equal('foo');
        });

        it('creates a new rule with default config', function () {
            const config = { configSet: true };

            this.ruleBook.add('foo', config);

            expect(this.ruleBook.rules).to.be.lengthOf(1);
            expect(this.ruleBook.rules[0]).to.be.instanceOf(Rule);
            expect(this.ruleBook.rules[0].config().configSet).to.equal(true);
        });

        it('adds the rule when called with a Rule', function () {
            this.ruleBook.add(new Rule('foo', this.ruleBook));

            expect(this.ruleBook.rules).to.be.lengthOf(1);
            expect(this.ruleBook.rules[0]).to.be.instanceOf(Rule);
            expect(this.ruleBook.rules[0].name).to.equal('foo');
        });

        it('adds the rule when called with a function resolving to a Rule', function () {
            this.ruleBook.add(() => {
                return new Rule('foo', this.ruleBook);
            });

            expect(this.ruleBook.rules).to.be.lengthOf(1);
            expect(this.ruleBook.rules[0]).to.be.instanceOf(Rule);
            expect(this.ruleBook.rules[0].name).to.equal('foo');
        });

        it('adds the rule when called with a function resolving to a Rule without Rulebook', function () {
            this.ruleBook.add(() => {
                return new Rule('foo');
            });

            expect(this.ruleBook.rules).to.be.lengthOf(1);
            expect(this.ruleBook.rules[0]).to.be.instanceOf(Rule);
            expect(this.ruleBook.rules[0].name).to.equal('foo');
        });

        it('throws an error when the same rule is added twice', function () {
            this.ruleBook.add('foo');

            expect(this.ruleBook.add.bind(this.ruleBook, 'foo')).to.throw(
                "The rule named 'foo' already exists in the set"
            );
        });

        it('sets the rule specific config from the ruleBook config', function () {
            const config = {
                rules: {
                    foo: { bar: 'fizz' },
                },
            };
            this.ruleBook.config.set(config);
            this.ruleBook.add('foo');

            expect(this.ruleBook.rules[0].config().bar).to.equal('fizz');
        });

        it(
            'overwrites the rule default config with the specific config ' +
                'from the ruleBook config',
            function () {
                const config = {
                    rules: {
                        foo: { sizzle: false },
                    },
                };
                this.ruleBook.config.set(config);
                this.ruleBook.add('foo', {
                    sizzle: true,
                    fizzle: true,
                });

                expect(this.ruleBook.rules[0].config()).to.deep.equal({
                    required: 'must',
                    sizzle: false,
                    fizzle: true,
                });
            }
        );
    });

    describe('omit', function () {
        beforeEach(function () {
            this.ruleBook = new Rulebook(rulebookConfigDefault);

            this.ruleBook.add('fizz');
            this.ruleBook.add('buzz');
            this.ruleBook.add('fizzbuzz');
        });

        it('returns a new set not containing the exact rule by name', function () {
            const newSet = this.ruleBook.omit('fizz');

            expect(this.ruleBook).to.not.equal(newSet);
            expect(this.ruleBook.config.full).to.deep.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(2);
            expect(newSet.rules[0].name).to.equal('buzz');
            expect(newSet.rules[1].name).to.equal('fizzbuzz');
        });

        it('returns a new set not containing the multiple rules by name pattern', function () {
            const newSet = this.ruleBook.omit('fizz*');

            expect(this.ruleBook).to.not.equal(newSet);
            expect(this.ruleBook.config.full).to.deep.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(1);
            expect(newSet.rules[0].name).to.equal('buzz');
        });

        it('returns a full copy of the set when the name pattern does not match any rule', function () {
            const newSet = this.ruleBook.omit('foo');

            expect(this.ruleBook).to.not.equal(newSet);
            expect(this.ruleBook.config.full).to.deep.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(3);
        });
    });

    describe('has', function () {
        beforeEach(function () {
            this.ruleBook = new Rulebook(rulebookConfigDefault);

            this.ruleBook.add('fizz');
            this.ruleBook.add('buzz');
            this.ruleBook.add('fizzbuzz');
        });

        it('returns true if the set contains the exact rule name', function () {
            expect(this.ruleBook.has('fizz')).to.be.true;
        });

        it('returns false if the set does not contain the exact rule name', function () {
            expect(this.ruleBook.has('foo')).to.be.false;
        });

        it('returns true if the set contains the rule name pattern', function () {
            expect(this.ruleBook.has('fizz*')).to.be.true;
        });

        it('returns false if the set does not contain the rule name pattern', function () {
            expect(this.ruleBook.has('foo*')).to.be.false;
        });
    });

    describe('filter', function () {
        beforeEach(function () {
            this.ruleBook = new Rulebook(rulebookConfigDefault);

            this.ruleBook.add('fizz');
            this.ruleBook.add('buzz');
            this.ruleBook.add('fizzbuzz');
        });

        it('returns a new set only containing the exact rule by name', function () {
            const newSet = this.ruleBook.filter('fizz');

            expect(this.ruleBook).to.not.equal(newSet);
            expect(this.ruleBook.config.full).to.deep.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(1);
            expect(newSet.rules[0].name).to.equal('fizz');
        });

        it('returns a new set only containing the multiple rules by name pattern', function () {
            const newSet = this.ruleBook.filter('fizz*');

            expect(this.ruleBook).to.not.equal(newSet);
            expect(this.ruleBook.config.full).to.deep.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(2);
            expect(newSet.rules[0].name).to.equal('fizz');
            expect(newSet.rules[1].name).to.equal('fizzbuzz');
        });

        it('returns a new empty set when the name pattern does not match any rule', function () {
            const newSet = this.ruleBook.filter('foo');

            expect(this.ruleBook).to.not.equal(newSet);
            expect(this.ruleBook.config.full).to.deep.equal(newSet.config.full);
            expect(newSet).to.be.lengthOf(0);
        });
    });

    describe('enforce', function () {
        beforeEach(function () {
            this.ruleBook = new Rulebook(rulebookConfigDefault);
        });

        it('sorts before enforcing', async function () {
            const sortSpy = sinon.spy(this.ruleBook, 'sortRules');

            this.ruleBook.rulesSorted = false;

            this.ruleBook.add('foo').define(() => true);
            await this.ruleBook.enforce('foo');

            expect(sortSpy.callCount).to.equal(1);
            expect(this.ruleBook.rulesSorted).to.be.true;

            await this.ruleBook.enforce('foo');

            expect(sortSpy.callCount).to.equal(1);
            expect(this.ruleBook.rulesSorted).to.be.true;

            sortSpy.restore();
        });

        it('logs a warning when there are no rules in the set', async function () {
            const logStub = sinon.stub(this.ruleBook.log, 'warn');

            await this.ruleBook.enforce('foo');

            expect(logStub.callCount).to.equal(1);
            expect(logStub.getCall(0).lastArg).to.equal('No rules to enforce. Rulebook is empty');

            logStub.restore();
        });

        it('logs a warning when no rules match the rule name pattern', async function () {
            const logStub = sinon.stub(this.ruleBook.log, 'warn');

            this.ruleBook.add('fizz');
            await this.ruleBook.enforce('untraceable');

            expect(logStub.callCount).to.equal(1);
            expect(logStub.getCall(0).lastArg).to.equal(
                `No rules to enforce for name pattern 'untraceable'`
            );

            logStub.restore();
        });

        it('enforces all rules in ascending order of specificity', async function () {
            this.ruleBook.config.set({ enforceParallel: false });

            let order = 0;

            this.ruleBook.add('fizz-bar-buzz').define(() => {
                order++;
                expect(order).to.equal(2);
                return true;
            });

            this.ruleBook.add('fizz').define(() => {
                order++;
                expect(order).to.equal(1);
                return true;
            });

            this.ruleBook.add('fizz-buzz').define(() => {
                order++;
                expect(order).to.equal(3);
                return true;
            });

            await this.ruleBook.enforce('fizz*');
            expect(order).to.equal(3);
        });

        it('enforces all rules in parallel mode', async function () {
            this.ruleBook.config.set({ enforceParallel: true });

            let count = 0;

            this.ruleBook.add('fizz-bar-buzz').define(() => {
                count++;
                return true;
            });

            this.ruleBook.add('fizz').define(() => {
                count++;
                return true;
            });

            this.ruleBook.add('fizz-buzz').define(() => {
                count++;
                return true;
            });

            await this.ruleBook.enforce('fizz*');
            expect(count).to.equal(3);
        });
    });
});
