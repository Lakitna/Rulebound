/* istanbul ignore file */
import consola from 'consola';

const log = consola
    .create({})
    .withTag('lawful');

/**
 * A convenience function that enables setting log level via its name
 * @param level Name of the log level
 */
const setLogLevel = (level: string) => {
    // @ts-ignore log._types is a private constant and is not included in consola.d.ts
    const logTypes = log._types;

    const type = logTypes[level];
    if (type === undefined) {
        throw new Error(`Unkown log level ${level}`);
    }

    // @ts-ignore log.level is a public that's not included in consola.d.ts
    log.level = type.level;
};


export { log, setLogLevel };
