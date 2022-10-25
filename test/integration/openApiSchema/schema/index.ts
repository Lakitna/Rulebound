import { Rulebook } from '../../../../src/rulebook';

export default async (rulebook: Rulebook) => {
    const module = await import('./is-kown-type');
    await module.default(rulebook);
};
