import c from 'ansi-colors';

export type logLevelNames = 'debug' | 'info' | 'warn' | 'error';
interface LogLevel {
    marker: () => string;
    rank: number;
}

const levels: Record<logLevelNames, LogLevel> = {
    debug: {
        marker: () => c.grey('»'),
        rank: 0,
    },
    info: {
        marker: () => c.blueBright('i'),
        rank: 1,
    },
    warn: {
        marker: () => '\n' + c.bgYellow.black(` WARN `),
        rank: 2,
    },
    error: {
        marker: () => '\n' + c.bgRed.black(` ERROR `),
        rank: 3,
    },
} as const;

// eslint-disable-next-line @typescript-eslint/ban-types
export class Logger<M extends Record<string, string | number> = {}> {
    public level: logLevelNames;
    public rank: number;
    private meta?: M;

    constructor(level: logLevelNames, meta?: M) {
        this.level = level;
        this.rank = levels[level].rank;
        this.meta = meta;
    }

    /**
     * Returns a child logger
     */
    child(meta: M): Logger<M> {
        return new Logger(this.level, meta);
    }

    debug(message: string) {
        return this._log(levels.debug, message);
    }

    info(message: string) {
        return this._log(levels.info, message);
    }

    warn(message: string) {
        return this._log(levels.warn, message);
    }

    error(message: string) {
        return this._log(levels.error, message);
    }

    private _log(level: LogLevel, message: string) {
        if (this.rank > level.rank) {
            return;
        }

        const logLine = level.marker() + ' ' + message;

        if (this.meta?.rule) {
            console.log(this._logLineLeftRight(logLine, c.grey(`${this.meta.rule}`)));
        } else {
            console.log(logLine);
        }
    }

    private _logLineLeftRight(left: string, right: string) {
        const leftWidth = c.stripColor(left.trim()).length;
        const rightWidth = c.stripColor(right.trim()).length;
        const consoleWidth = process.stdout.columns || 0;

        let spaceCount = 1;
        if (consoleWidth > 0) {
            spaceCount = consoleWidth - leftWidth - rightWidth - 1;
            while (spaceCount <= 0) {
                spaceCount += consoleWidth;
            }
        }

        return left + ' '.repeat(spaceCount) + right;
    }
}
export const logger = new Logger('info');
