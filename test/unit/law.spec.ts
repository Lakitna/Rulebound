import * as sinon from 'sinon';
import { expect } from 'chai';

import { Law } from '../../src/law';
import { Lawbook } from '../../src/lawbook';
import c from 'ansi-colors';


describe('The class Law', function() {
    it('initializes', function() {
        const law = new Law('foo', {} as Lawbook);

        expect(law).to.be.instanceOf(Law);
        expect(law.name).to.equal('foo');
    });

    describe('Config', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('initializes with defaults', function() {
            expect(this.law._config).to.deep.equal({
                severity: 'must',
                _name: '*',
                _throw: 'error',
                _specificity: 0,
            });
        });

        it('sets the config', function() {
            const config = {
                severity: null,
                foo: 'bar',
            };

            this.law.config = Object.assign({}, config);

            expect(this.law.config).to.deep.equal(config);
        });

        it('does not remove existing config when setting other values', function() {
            this.law.config = {
                foo: 'bar',
            };

            this.law.config = {
                fizz: 'buzz',
            };

            expect(this.law.config).to.deep.equal({
                severity: 'must',
                foo: 'bar',
                fizz: 'buzz',
            });
        });

        it('throws when specifying an unkown severity level', function() {
            this.law.lawbook.config = {
                generic: {
                    severity: {
                        'known level': 'error',
                        'another known level': 'warn',
                    },
                },
            };

            expect(() => {
                this.law.config = { severity: 'unkown level' };
            }).to.throw(`Found unkown severity 'unkown level' in the configuration for law 'foo'`);
        });
    });

    describe('Definition', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('throws an error when called before its set', async function() {
            expect(this.law.handler.enforce).to.be.lengthOf(1);
            expect(this.law.handler.enforce[0].name).to.equal('undefined');

            await expect(this.law.enforce())
                .to.be.rejectedWith('Law is undefined');
        });

        it('sets the defintion', async function() {
            function noop() { return true; }

            this.law.define(noop);

            expect(this.law.handler.enforce).to.be.lengthOf(1);
            expect(this.law.handler.enforce[0].name).to.equal('enforce');

            await expect(this.law.enforce())
                .to.be.fulfilled;
        });

        it('takes multiple definitions', async function() {
            this.law.define(() => true);
            this.law.define(() => true);
            this.law.define(() => true);

            expect(this.law.handler.enforce).to.be.lengthOf(3);
            for (const fn of this.law.handler.enforce) {
                expect(fn.name).to.equal('enforce');
            }
            expect(this.law.handler.enforce[0])
                .to.not.equal(this.law.handler.enforce[1])
                .to.not.equal(this.law.handler.enforce[2]);
        });

        it('is chainable', function() {
            const returnValue = this.law.define(() => {});
            expect(returnValue).to.equal(this.law);
        });
    });

    describe('Description', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('is chainable', function() {
            expect(this.law.describe('foo')).to.equal(this.law);
        });

        it('removes indentation from each line of a regular string', function() {
            this.law.describe('  FirstLine\n\tSecondLine');

            expect(this.law.description).to.equal('FirstLine\nSecondLine')
        });

        it('removes indentation from each line of a template literal', function() {
            this.law.describe(`
                FirstLine
                SecondLine
            `);

            expect(this.law.description).to.equal('FirstLine\nSecondLine')
        });

        it('includes the description in the error', async function() {
            this.law
                .define(() => false)
                .describe('awesome description');

            try {
                await this.law.enforce();
            }
            catch (error) {
                expect(error.description).to.equal('awesome description');
            }
        });
    });

    describe('fail', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('throws when called before its set with input', async function() {
            expect(this.law.handler.fail).to.be.lengthOf(1);
            expect(this.law.handler.fail[0].name).to.equal('undefined');

            expect(this.law.handler.fail[0].bind(this.law, ['input'], 'foo'))
                .to.throw('foo');
        });

        it('throws when called before its set with error', async function() {
            expect(this.law.handler.fail).to.be.lengthOf(1);
            expect(this.law.handler.fail[0].name).to.equal('undefined');

            expect(this.law.handler.fail[0].bind(this.law, ['input'], new Error('foo')))
                .to.throw('foo');
        });

        it('sets the punishment', function() {
            function noop() { return; }

            this.law.punishment(noop);

            expect(this.law.handler.fail).to.be.lengthOf(1);
            expect(this.law.handler.fail[0].name).to.equal('fail');
        });

        it('takes multiple punishments', async function() {
            this.law.punishment(() => true);
            this.law.punishment(() => true);
            this.law.punishment(() => true);

            expect(this.law.handler.fail).to.be.lengthOf(3);
            for (const fn of this.law.handler.fail) {
                expect(fn.name).to.equal('fail');
            }
            expect(this.law.handler.fail[0])
                .to.not.equal(this.law.handler.fail[1])
                .to.not.equal(this.law.handler.fail[2]);
        });

        it('is chainable', function() {
            expect(this.law.punishment(() => {})).to.equal(this.law);
        });
    });

    describe('Reward', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('is a noop when called before its set', function() {
            expect(this.law.handler.pass).to.be.lengthOf(1);
            expect(this.law.handler.pass[0].name).to.equal('undefined');

            expect(this.law.handler.pass[0])
                .to.not.throw();
        });

        it('sets the reward', function() {
            function noop() { return; }

            this.law.reward(noop);

            expect(this.law.handler.pass).to.be.lengthOf(1);
            expect(this.law.handler.pass[0].name).to.equal('pass');
        });

        it('takes multiple rewards', async function() {
            this.law.reward(() => true);
            this.law.reward(() => true);
            this.law.reward(() => true);

            expect(this.law.handler.pass).to.be.lengthOf(3);
            for (const fn of this.law.handler.pass) {
                expect(fn.name).to.equal('pass');
            }
            expect(this.law.handler.pass[0])
                .to.not.equal(this.law.handler.pass[1])
                .to.not.equal(this.law.handler.pass[2]);
        });

        it('is chainable', function() {
            expect(this.law.reward(() => {})).to.equal(this.law);
        });
    });

    describe('Alias', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('is chainable', function() {
            expect(this.law.alias('foo')).to.be.instanceOf(Law);
        });
    });

    describe('Enforce', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('does not check the law if the option _throw=null', function() {
            this.law.config = { _throw: null };

            this.law
                .define(() => false)
                .punishment(() => {
                    throw new Error('Enforce should not punish');
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns false', function(done) {
            this.law
                .define(() => false)
                .punishment((input: any[], result: boolean) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.deep.equal([ false ]);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition throws an error', function(done) {
            this.law
                .define(() => {
                    throw new Error('Some error');
                })
                .punishment((input: any[], result: Error) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.be.instanceOf(Error);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns an error message', function(done) {
            this.law
                .define(() => 'foo')
                .punishment((input: any[], result: string) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.deep.equal([ 'foo' ]);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns a promise resolving to false', function(done) {
            this.law
                .define(() => {
                    return new Promise((resolve) => {
                        resolve(false);
                    });
                })
                .punishment((input: any[], result: boolean) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.deep.equal([ false ]);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns a promise that throws an error', function(done) {
            this.law
                .define(() => {
                    return new Promise(() => {
                        throw new Error('Some error');
                    });
                })
                .punishment((input: any[], result: Error) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.be.instanceOf(Error);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns a promise resolving in an error message', function(done) {
            this.law
                .define(() => {
                    return new Promise((resolve) => {
                        resolve('foo');
                    });
                })
                .punishment((input: any[], result: string) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.deep.equal([ 'foo' ]);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('rewards when the definitions returns true', function(done) {
            this.law
                .define(() => true)
                .punishment(() => {
                    throw new Error('Enforce should not punish');
                })
                .reward(() => {
                    done();
                })
                .enforce();
        });

        it('rewards when the definitions returns a promise resolving true', function(done) {
            this.law
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

        it('returns a promise containing the law object instance', function() {
            this.law
                .define(() => true)
                .enforce(true)
                .then((returnValue: Law) => {
                    expect(returnValue).to.equal(this.law);
                });
        });

        it('handles an error thrown by reward', async function() {
            this.law
                .define(() => true)
                .reward(() => {
                    throw new Error('Reward error');
                });

            try {
                await this.law.enforce();
                throw new Error('Expected error to be thrown')
            }
            catch (error) {
                expect(error.message).to.equal('Reward error');
            }
        });

        it('handles an error thrown by punishment', async function() {
            this.law
                .define(() => false)
                .punishment(() => {
                    throw new Error('Punishment error');
                });

            try {
                await this.law.enforce();
                throw new Error('Expected error to be thrown')
            }
            catch (error) {
                expect(error.message).to.equal('Punishment error');
            }
        });

        it('rethrows errors thrown by nested laws via the punishment of the parent law', function(done) {
            this.law
                .define(async () => {
                    await new Law('bar', {} as Lawbook)
                        .define(() => false)
                        .enforce();
                })
                .punishment((input: undefined, error: Error) => {
                    throw error;
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                });

            this.law.enforce()
                .then(() => {
                    throw new Error('Expected error to be thrown')
                })
                .catch((error: any) => {
                    expect(error.law.name).to.equal('bar');
                    done();
                });
        });

        describe('Using an alias', function() {
            beforeEach(function() {
                this.lawbook = new Lawbook();
            });

            it('throws an error thrown by the aliased law in name of the alias', async function() {
                this.lawbook.add('bar').define(() => 'alias failed');
                this.lawbook.add('foo').alias('bar');

                try {
                    await this.lawbook.enforce('foo');
                    throw new Error('Expected error to be thrown');
                }
                catch (error) {
                    expect(error.law.name).to.equal('foo');
                    expect(error.message).to.equal('alias failed');
                }
            });

            it('throws when the alias does not exist', async function() {
                this.lawbook.add('foo').alias('bar');

                try {
                    await this.lawbook.enforce('foo');
                    throw new Error('Expected error to be thrown');
                }
                catch (error) {
                    expect(error.message).to.equal(`Could not find alias named 'bar'`);
                }
            });

            it('passes the alias when the aliassed law passes', async function() {
                this.lawbook.add('bar').define(() => true);
                this.lawbook.add('foo').alias('bar');

                await this.lawbook.enforce('foo');
            });

            context('Aliased laws will throw with the severity of the alias', function() {
                it('throws with the aliased law having the severity null', async function() {
                    this.lawbook.add('bar', {severity: null}).define(() => 'alias failed');
                    this.lawbook.add('foo').alias('bar');

                    try {
                        await this.lawbook.enforce('foo');
                        throw new Error('Expected error to be thrown');
                    }
                    catch (error) {
                        expect(error.law.name).to.equal('foo');
                        expect(error.message).to.equal('alias failed');
                    }
                });

                it('throws with the aliased law having the severity should', async function() {
                    this.lawbook.add('bar', {severity: 'should'}).define(() => 'alias failed');
                    this.lawbook.add('foo').alias('bar');

                    try {
                        await this.lawbook.enforce('foo');
                        throw new Error('Expected error to be thrown');
                    }
                    catch (error) {
                        expect(error.law.name).to.equal('foo');
                        expect(error.message).to.equal('alias failed');
                    }
                });
            });

            context('Punish & reward', function() {
                it('will not call the punishment of the alias, only that of the aliassed', async function() {
                    let aliassed = false;
                    let alias = false;

                    this.lawbook.add('bar')
                        .define(() => false)
                        .punishment(() => { aliassed = true; });

                    this.lawbook.add('foo')
                        .alias('bar')
                        .punishment(() => { alias = true; });

                    await this.lawbook.enforce('foo');
                    expect(aliassed).to.be.true;
                    expect(alias).to.be.false;
                });

                it('will not call the reward of the alias, only that of the aliassed', async function() {
                    let aliassed = false;
                    let alias = false;

                    this.lawbook.add('bar')
                        .define(() => true)
                        .reward(() => { aliassed = true; });

                    this.lawbook.add('foo')
                        .alias('bar')
                        .reward(() => { alias = true; });

                    await this.lawbook.enforce('foo');
                    expect(aliassed).to.be.true;
                    expect(alias).to.be.false;
                });
            });
        });

        describe('Multiple handlers per event', function() {
            it('calls all enforce events in order', async function() {
                const called: number[][] = [];

                for (let i = 0; i < 100; i++) {
                    called.push([i, 0]);

                    this.law.on('enforce', () => {
                        called[i][1]++;
                        return true;
                    });
                }

                await this.law.enforce();

                called.forEach((call: number[]) => {
                    expect(call[1]).to.equal(1);
                });
            });

            it('calls all fail events in order', async function() {
                const called: number[][] = [];

                this.law.on('enforce', () => false);

                for (let i = 0; i < 100; i++) {
                    called.push([i, 0]);

                    this.law.on('fail', () => {
                        called[i][1]++;
                        return true;
                    });
                }

                await this.law.enforce();

                called.forEach((call: number[]) => {
                    expect(call[1]).to.equal(1);
                });
            });

            it('calls all pass events in order', async function() {
                const called: number[][] = [];

                this.law.on('enforce', () => true);

                for (let i = 0; i < 100; i++) {
                    called.push([i, 0]);

                    this.law.on('pass', () => {
                        called[i][1]++;
                        return true;
                    });
                }

                await this.law.enforce();

                called.forEach((call: number[]) => {
                    expect(call[1]).to.equal(1);
                });
            });
        });
    });

    describe('Throw', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook)
                .define(() => false);
        });

        it('throws an error when the option throw=error', function() {
            this.law.config = { _throw: 'error' };

            expect(this.law.throw.bind(this.law, undefined, 'bar'))
                .to.throw('bar');
        });

        it('logs an error when the options throw=warn', function(done) {
            const logStub = sinon.stub(this.law.log, 'warn');

            this.law.config = { _throw: 'warn' };
            this.law.throw(undefined, 'bar');

            expect(logStub.callCount).to.equal(1);
            expect(c.stripColor(logStub.getCall(0).lastArg))
                .to.endWith('bar');

            done();
        });

        it('logs when the options throw=log', function(done) {
            const logStub = sinon.stub(this.law.log, 'info');

            this.law.config = { _throw: 'info' };
            this.law.throw(undefined, 'bar');

            expect(logStub.callCount).to.equal(1);
            expect(c.stripColor(logStub.getCall(0).lastArg))
                .to.endWith('bar');

            done();
        });
    });
});
