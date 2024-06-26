/* eslint-disable @typescript-eslint/no-empty-function */
import { expect } from 'chai';
import sinon from 'sinon';

import c from 'ansi-colors';
import { GlobSpecificity } from 'glob-specificity';
import { RuleConfig } from '../../src';
import { RuleError } from '../../src/errors/rule-error';
import { Rule } from '../../src/rule';
import { Rulebook } from '../../src/rulebook';

describe('The class Rule', function () {
    it('initializes', function () {
        const rule = new Rule('foo', {} as Rulebook);

        expect(rule).to.be.instanceOf(Rule);
        expect(rule.name).to.equal('foo');
    });

    describe('clone', function () {
        it('clones a simple rule', function () {
            const original = new Rule('foo');
            const clone = original.clone();

            // Not the same object reference
            expect(original).to.not.equal(clone);
            // The same object contents
            expect(original).to.deep.equal(clone);
        });

        it('clones a rule with config', function () {
            const original = new Rule('foo').config({ lorum: 'ipsum', dolor: 123 });
            const clone = original.clone();

            // Not the same object reference
            expect(original).to.not.equal(clone);
            // The same object contents
            expect(original).to.deep.equal(clone);
            expect(original.config()).to.deep.equal(clone.config());
        });

        it('the cloned rule has methods', function () {
            const original = new Rule('foo');
            const clone = original.clone().config({ lorum: 'ipsum', dolor: 123 });

            // Not the same object reference
            expect(original).to.not.equal(clone);
            expect(original.config()).to.deep.equal({ required: 'must' });
            expect(clone.config()).to.deep.equal({ required: 'must', lorum: 'ipsum', dolor: 123 });
        });

        it('clones a rule with handlers', function () {
            const original = new Rule('foo')
                .define(() => true)
                .define(() => true)
                .punishment(() => {})
                .reward(() => {});
            const clone = original.clone();

            // Not the same object reference
            expect(original).to.not.equal(clone);
            // The same object contents
            expect(original).to.deep.equal(clone);

            // @ts-expect-error using a private var
            const cloneHandlers = clone._handler;
            expect(cloneHandlers.enforce.length).to.equal(2);
            expect(cloneHandlers.pass.length).to.equal(1);
            expect(cloneHandlers.fail.length).to.equal(1);
        });
    });

    describe('Config', function () {
        beforeEach(function () {
            this.rule = new Rule('foo', {} as Rulebook);
        });

        it('initializes with defaults', function () {
            expect(this.rule._config).to.deep.equal({
                required: 'must',
                _name: '*',
                _throw: 'error',
                _specificity: new GlobSpecificity(0, 0, 0, 0, 0),
            });
        });

        it('sets the config', function () {
            const config = {
                required: null,
                foo: 'bar',
            };

            this.rule.config(Object.assign({}, config));

            expect(this.rule.config()).to.deep.equal(config);
        });

        it('does not remove existing config when setting other values', function () {
            this.rule.config({
                foo: 'bar',
            });

            this.rule.config({
                fizz: 'buzz',
            });

            expect(this.rule.config()).to.deep.equal({
                required: 'must',
                foo: 'bar',
                fizz: 'buzz',
            });
        });

        it('throws when specifying an unkown severity level', function () {
            this.rule.rulebook.config = {
                generic: {
                    severity: {
                        'known level': 'error',
                        'another known level': 'warn',
                    },
                },
            };

            expect(() => {
                this.rule.config({ required: 'unkown level' });
            }).to.throw(
                `Found unkown required level 'unkown level' in the configuration for rule 'foo'`
            );
        });
    });

    describe('on', function () {
        beforeEach(function () {
            this.rule = new Rule('foo', {} as Rulebook);
        });

        it('throws when trying to add an unkown event', async function () {
            expect(() => {
                this.rule.on('unkown', () => {});
            }).to.throw(`Tried to subscribe to unkown event 'unkown'`);
        });

        it('adds a handler', async function () {
            expect(this.rule._handler['enforce'].length).to.equal(0);

            this.rule.on('enforce', () => {});

            expect(this.rule._handler['enforce'].length).to.equal(1);
            expect(this.rule._handler['enforce'][0].name).to.equal('enforce');
        });

        it('adds two handlers', async function () {
            expect(this.rule._handler['enforce'].length).to.equal(0);

            this.rule.on('enforce', () => {});
            this.rule.on('enforce', () => {});

            expect(this.rule._handler['enforce'].length).to.equal(2);
            expect(this.rule._handler['enforce'][0].name).to.equal('enforce');
            expect(this.rule._handler['enforce'][1].name).to.equal('enforce');
        });
    });

    describe('Definition', function () {
        beforeEach(function () {
            this.rule = new Rule('foo', {} as Rulebook);
        });

        it('has no default handler', async function () {
            expect(this.rule._handler.enforce).to.be.lengthOf(0);
        });

        it('sets the defintion', async function () {
            function noop() {
                return true;
            }

            this.rule.define(noop);

            expect(this.rule._handler.enforce).to.be.lengthOf(1);
            expect(this.rule._handler.enforce[0].name).to.equal('enforce');

            await expect(this.rule.enforce()).to.be.fulfilled;
        });

        it('takes multiple definitions', async function () {
            this.rule.define(() => true);
            this.rule.define(() => true);
            this.rule.define(() => true);

            expect(this.rule._handler.enforce).to.be.lengthOf(3);
            for (const enforceHander of this.rule._handler.enforce) {
                expect(enforceHander.name).to.equal('enforce');
            }
            expect(this.rule._handler.enforce[0])
                .to.not.equal(this.rule._handler.enforce[1])
                .to.not.equal(this.rule._handler.enforce[2]);
        });

        it('is chainable', function () {
            const returnValue = this.rule.define(() => {});
            expect(returnValue).to.equal(this.rule);
        });
    });

    describe('Description', function () {
        beforeEach(function () {
            this.rule = new Rule('foo', {} as Rulebook);
        });

        it('is chainable', function () {
            expect(this.rule.describe('foo')).to.equal(this.rule);
        });

        it('removes indentation from each line of a regular string', function () {
            this.rule.describe('  FirstLine\n\n\tSecondLine');

            expect(this.rule.description).to.equal('FirstLine\n\nSecondLine');
        });

        it('removes indentation from each line of a template literal', function () {
            this.rule.describe(`
                FirstLine

                SecondLine
            `);

            expect(this.rule.description).to.equal('FirstLine\n\nSecondLine');
        });

        it('includes the description when an error is thrown', async function () {
            this.rule.define(() => false).describe('awesome description');

            try {
                await this.rule.enforce();
            } catch (error) {
                expect((error as RuleError).description).to.equal('awesome description');
            }
        });
    });

    describe('fail', function () {
        beforeEach(function () {
            this.rule = new Rule('foo', {} as Rulebook);
        });

        it('has no default handlers', async function () {
            expect(this.rule._handler.fail).to.be.lengthOf(0);
        });

        it('sets the punishment', function () {
            function noop() {
                return;
            }

            this.rule.punishment(noop);

            expect(this.rule._handler.fail).to.be.lengthOf(1);
            expect(this.rule._handler.fail[0].name).to.equal('fail');
        });

        it('takes multiple punishments', async function () {
            this.rule.punishment(() => true);
            this.rule.punishment(() => true);
            this.rule.punishment(() => true);

            expect(this.rule._handler.fail).to.be.lengthOf(3);
            for (const failHandler of this.rule._handler.fail) {
                expect(failHandler.name).to.equal('fail');
            }
            expect(this.rule._handler.fail[0])
                .to.not.equal(this.rule._handler.fail[1])
                .to.not.equal(this.rule._handler.fail[2]);
        });

        it('is chainable', function () {
            expect(this.rule.punishment(() => {})).to.equal(this.rule);
        });
    });

    describe('Reward', function () {
        beforeEach(function () {
            this.rule = new Rule('foo', {} as Rulebook);
        });

        it('has no default handlers', function () {
            expect(this.rule._handler.pass).to.be.lengthOf(0);
        });

        it('sets the reward', function () {
            function noop() {
                return;
            }

            this.rule.reward(noop);

            expect(this.rule._handler.pass).to.be.lengthOf(1);
            expect(this.rule._handler.pass[0].name).to.equal('pass');
        });

        it('takes multiple rewards', async function () {
            this.rule.reward(() => true);
            this.rule.reward(() => true);
            this.rule.reward(() => true);

            expect(this.rule._handler.pass).to.be.lengthOf(3);
            for (const passHandler of this.rule._handler.pass) {
                expect(passHandler.name).to.equal('pass');
            }
            expect(this.rule._handler.pass[0])
                .to.not.equal(this.rule._handler.pass[1])
                .to.not.equal(this.rule._handler.pass[2]);
        });

        it('is chainable', function () {
            expect(this.rule.reward(() => {})).to.equal(this.rule);
        });
    });

    describe('Alias', function () {
        beforeEach(function () {
            this.rule = new Rule('foo', {} as Rulebook);
        });

        it('is chainable', function () {
            expect(this.rule.alias('foo')).to.be.instanceOf(Rule);
        });
    });

    describe('Enforce', function () {
        beforeEach(function () {
            this.rule = new Rule('foo', {} as Rulebook);
        });

        it('does not check the rule if the option _throw=null', function () {
            this.rule.config({ _throw: null });

            this.rule
                .define(() => false)
                .punishment(() => {
                    throw new Error('Enforce should not punish');
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns false', function (done) {
            this.rule
                .define(() => false)
                .punishment((input: undefined, _config: RuleConfig, result: boolean) => {
                    expect(input).to.be.undefined;
                    expect(result).to.deep.equal([false]);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition throws an error', function (done) {
            this.rule
                .define(() => {
                    throw new Error('Some error');
                })
                .punishment((input: undefined, _config: RuleConfig, result: Error) => {
                    expect(input).to.be.undefined;
                    expect(result).to.be.instanceOf(Error);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition throws a non-error string', function (done) {
            this.rule
                .define(() => {
                    throw 'Some non-error';
                })
                .punishment((input: undefined, _config: RuleConfig, result: Error) => {
                    expect(input).to.be.undefined;
                    expect(result).to.be.instanceOf(Error);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns an error message', function (done) {
            this.rule
                .define(() => 'foo')
                .punishment((input: undefined, _config: RuleConfig, result: string) => {
                    expect(input).to.be.undefined;
                    expect(result).to.deep.equal(['foo']);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns a promise resolving to false', function (done) {
            this.rule
                .define(() => {
                    return new Promise((resolve) => {
                        resolve(false);
                    });
                })
                .punishment((input: undefined, _config: RuleConfig, result: boolean) => {
                    expect(input).to.be.undefined;
                    expect(result).to.deep.equal([false]);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns a promise that throws an error', function (done) {
            this.rule
                .define(() => {
                    return new Promise(() => {
                        throw new Error('Some error');
                    });
                })
                .punishment((input: undefined, _config: RuleConfig, result: Error) => {
                    expect(input).to.be.undefined;
                    expect(result).to.be.instanceOf(Error);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns a promise resolving in an error message', function (done) {
            this.rule
                .define(() => {
                    return new Promise((resolve) => {
                        resolve('foo');
                    });
                })
                .punishment((input: undefined, _config: RuleConfig, result: string) => {
                    expect(input).to.be.undefined;
                    expect(result).to.deep.equal(['foo']);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('rewards when the definitions returns true', function (done) {
            this.rule
                .define(() => true)
                .punishment(() => {
                    throw new Error('Enforce should not punish');
                })
                .reward(() => {
                    done();
                })
                .enforce();
        });

        it('rewards when the definitions returns a promise resolving true', function (done) {
            this.rule
                .define(() => {
                    return new Promise((resolve) => {
                        resolve(true);
                    });
                })
                .punishment(() => {
                    throw new Error('Enforce should not punish');
                })
                .reward(() => {
                    done();
                })
                .enforce();
        });

        it('returns a promise containing the rule object instance', function () {
            this.rule
                .define(() => true)
                .enforce(true)
                .then((returnValue: Rule) => {
                    expect(returnValue).to.equal(this.rule);
                });
        });

        it('handles an error thrown by reward', async function () {
            this.rule
                .define(() => true)
                .reward(() => {
                    throw new Error('Reward error');
                });

            try {
                await this.rule.enforce();
                throw new Error('Expected error to be thrown');
            } catch (error) {
                expect((error as Error).message).to.equal('Reward error');
            }
        });

        it('handles an error thrown by punishment', async function () {
            this.rule
                .define(() => false)
                .punishment(() => {
                    throw new Error('Punishment error');
                });

            try {
                await this.rule.enforce();
                throw new Error('Expected error to be thrown');
            } catch (error) {
                expect((error as Error).message).to.equal('Punishment error');
            }
        });

        it('rethrows errors thrown by nested rules via the punishment of the parent rule', function (done) {
            this.rule
                .define(async () => {
                    await new Rule('bar', {} as Rulebook).define(() => false).enforce('**');
                })
                .punishment((_input: undefined, _config: RuleConfig, error: Error) => {
                    throw error;
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                });

            this.rule
                .enforce()
                .then(() => {
                    throw new Error('Expected error to be thrown');
                })
                .catch((error: any) => {
                    expect(error.rule).to.equal('bar');
                    done();
                });
        });

        describe('Using an alias', function () {
            beforeEach(function () {
                this.rulebook = new Rulebook();
            });

            it('throws when the rule does not have a rulebook', async function () {
                const rule = new Rule('foo').alias('bar');

                try {
                    await rule.enforce('foo');
                    throw new Error('Expected error to be thrown');
                } catch (error) {
                    expect((error as Error).message).to.equal(
                        `Rule is not part of a Rulebook. Can't look for alias 'bar'`
                    );
                }
            });

            it('throws an error thrown by the aliased rule in name of the alias', async function () {
                this.rulebook.add('bar').define(() => 'alias failed');
                this.rulebook.add('foo').alias('bar');

                try {
                    await this.rulebook.enforce('foo');
                    throw new Error('Expected error to be thrown');
                } catch (error) {
                    expect(error).to.be.instanceOf(RuleError);
                    expect((error as RuleError).rule).to.equal('foo');
                    expect((error as Error).message).to.equal('alias failed');
                }
            });

            it('throws an error with the severity of the alias', async function () {
                this.rulebook.add('bar', { required: 'should' }).define(() => 'alias failed');
                this.rulebook.add('foo', { required: 'must' }).alias('bar');

                try {
                    await this.rulebook.enforce('foo');
                    throw new Error('Expected error to be thrown');
                } catch (error) {
                    expect(error).to.be.instanceOf(RuleError);
                    expect((error as RuleError).rule).to.equal('foo');
                    expect((error as Error).message).to.equal('alias failed');
                }
            });

            it('throws when the alias does not exist', async function () {
                this.rulebook.add('foo').alias('bar');

                try {
                    await this.rulebook.enforce('foo');
                    throw new Error('Expected error to be thrown');
                } catch (error) {
                    expect((error as Error).message).to.equal(
                        `Could not find alias rule named 'bar'`
                    );
                }
            });

            it('passes the alias when the aliassed rule passes', async function () {
                const definitionStub = sinon.stub().returns(true);

                this.rulebook.add('bar').define(definitionStub);
                this.rulebook.add('foo').alias('bar');

                await this.rulebook.enforce('foo');

                expect(definitionStub).to.have.been.calledOnce;
            });

            it('passes the alias when the daisy chained aliassed rule passes', async function () {
                const definitionStub = sinon.stub().returns(true);

                this.rulebook.add('baz').define(definitionStub);
                this.rulebook.add('bar').alias('baz');
                this.rulebook.add('foo').alias('bar');

                await this.rulebook.enforce('foo');

                expect(definitionStub).to.have.been.calledOnce;
            });

            context('Aliased rules will throw with the severity of the alias', function () {
                it('throws with the aliased rule having the severity null', async function () {
                    this.rulebook.add('bar', { severity: null }).define(() => 'alias failed');
                    this.rulebook.add('foo').alias('bar');

                    try {
                        await this.rulebook.enforce('foo');
                        throw new Error('Expected error to be thrown');
                    } catch (error) {
                        expect((error as RuleError).rule).to.equal('foo');
                        expect((error as Error).message).to.equal('alias failed');
                    }
                });

                it('throws with the aliased rule having the severity should', async function () {
                    this.rulebook.add('bar', { severity: 'should' }).define(() => 'alias failed');
                    this.rulebook.add('foo').alias('bar');

                    try {
                        await this.rulebook.enforce('foo');
                        throw new Error('Expected error to be thrown');
                    } catch (error) {
                        expect((error as RuleError).rule).to.equal('foo');
                        expect((error as Error).message).to.equal('alias failed');
                    }
                });
            });

            context('Punish & reward', function () {
                it('will not call the punishment of the alias, only that of the aliassed', async function () {
                    let aliassed = false;
                    let alias = false;

                    this.rulebook
                        .add('bar')
                        .define(() => false)
                        .punishment(() => {
                            aliassed = true;
                        });

                    this.rulebook
                        .add('foo')
                        .alias('bar')
                        .punishment(() => {
                            alias = true;
                        });

                    await this.rulebook.enforce('foo');
                    expect(aliassed).to.be.true;
                    expect(alias).to.be.false;
                });

                it('will call the reward of the alias, as well as the aliassed', async function () {
                    let aliassed = false;
                    let alias = false;

                    this.rulebook
                        .add('bar')
                        .define(() => true)
                        .reward(() => {
                            aliassed = true;
                        });

                    this.rulebook
                        .add('foo')
                        .alias('bar')
                        .reward(() => {
                            alias = true;
                        });

                    await this.rulebook.enforce('foo');
                    expect(aliassed).to.be.true;
                    expect(alias).to.be.true;
                });
            });
        });

        describe('Multiple handlers per event', function () {
            it('calls all enforce events in order', async function () {
                const called: number[][] = [];

                for (let index = 0; index < 100; index++) {
                    called.push([index, 0]);

                    this.rule.on('enforce', () => {
                        called[index][1]++;
                        return true;
                    });
                }

                await this.rule.enforce();

                called.forEach((call: number[]) => {
                    expect(call[1]).to.equal(1);
                });
            });

            it('calls all fail events in order', async function () {
                const called: number[][] = [];

                this.rule.on('enforce', () => false);

                for (let index = 0; index < 100; index++) {
                    called.push([index, 0]);

                    this.rule.on('fail', () => {
                        called[index][1]++;
                        return true;
                    });
                }

                await this.rule.enforce();

                called.forEach((call: number[]) => {
                    expect(call[1]).to.equal(1);
                });
            });

            it('calls all pass events in order', async function () {
                const called: number[][] = [];

                this.rule.on('enforce', () => true);

                for (let index = 0; index < 100; index++) {
                    called.push([index, 0]);

                    this.rule.on('pass', () => {
                        called[index][1]++;
                        return true;
                    });
                }

                await this.rule.enforce();

                called.forEach((call: number[]) => {
                    expect(call[1]).to.equal(1);
                });
            });
        });
    });

    describe('Throw', function () {
        beforeEach(function () {
            this.rule = new Rule('foo', {} as Rulebook).define(() => false);
        });

        it('throws an error when the option throw=error', function () {
            this.rule.config({ _throw: 'error' });

            expect(this.rule.throw.bind(this.rule, 'bar')).to.throw('bar');
        });

        it('logs an error when the options throw=warn', async function () {
            const logStub = sinon.stub(this.rule._log, 'warn');

            this.rule.config({ _throw: 'warn' });
            this.rule.throw('bar');

            expect(logStub.callCount).to.equal(1);
            expect(c.stripColor(logStub.getCall(0).lastArg)).to.equal('MUST bar');

            logStub.restore();
        });

        it('logs when the options throw=log', async function () {
            const logStub = sinon.stub(this.rule._log, 'info');

            this.rule.config({ _throw: 'info' });
            this.rule.throw('bar');

            expect(logStub.callCount).to.equal(1);
            expect(c.stripColor(logStub.getCall(0).lastArg)).to.equal('MUST bar');
        });

        it('does nothing when the options throw=null', async function () {
            const logStub = sinon.stub(this.rule._log, 'info');

            this.rule.config({ _throw: null });
            this.rule.throw('bar');

            expect(logStub.callCount).to.equal(0);
        });
    });

    describe('_validateName', function () {
        it('throws when an invalid name is provided', function () {
            expect(() => {
                new Rule('foo^', {} as Rulebook);
            }).to.throw(`'foo^' is not a valid rule name.`);
        });

        it('does nothing when a valid name is provided', function () {
            new Rule('foo', {} as Rulebook);
        });
    });
});
