import { Lawbook } from '../../src/lawbook';

export default (lawbook: Lawbook) => {
    lawbook
        .add('is-power-of')
        .define((number, power) => {
            return (number**(1/power)) % 1 === 0;
        })
        .punishment((input) => {
            throw new Error(`${input[0]} is not a power of ${input[1]}`);
        });
};
