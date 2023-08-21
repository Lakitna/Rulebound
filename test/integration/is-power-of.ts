import { Rulebook } from '../../src/rulebook';

export interface RuleParameters {
    number: number;
    power: number;
}

export default (rulebook: Rulebook<RuleParameters>) => {
    rulebook
        .add('is-power-of')
        .define(({ number, power }) => {
            return number ** (1 / power) % 1 === 0;
        })
        .punishment(({ number, power }) => {
            throw new Error(`${number} is not a power of ${power}`);
        });
};
