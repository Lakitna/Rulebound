import { Lawbook } from '../../../../src/lawbook';

export default async (lawbook: Lawbook) => {
    (await import('./is-kown-type')).default(lawbook);
};
