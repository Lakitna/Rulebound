import { Rulebook } from '../../../../src/rulebook';

export default async (rulebook: Rulebook) => {
    (await import('./is-kown-type')).default(rulebook);
};
