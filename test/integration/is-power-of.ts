import { Rulebook } from '../../src/rulebook';

export default (rulebook: Rulebook) => {
    rulebook
        .add('is-power-of')
        .define((number, power) => {
            return number ** (1 / power) % 1 === 0;
        })
        .punishment((input) => {
            throw new Error(`${input[0]} is not a power of ${input[1]}`);
        });
};
