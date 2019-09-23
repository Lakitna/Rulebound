/* istanbul ignore file */
import { createLogger, format, transports, Logger } from 'winston';
import c from 'ansi-colors';
import { TransformableInfo } from 'logform';

const levelMarkers = {
    debug: () => c.grey('»'),
    info: () => {
        return { color: c.bgBlue.white, text: ' i '};
    },
    warn: () => {
        return { color: c.bgYellow.black, text: ' WARN '};
    },
    error: () => {
        return { color: c.bgRed.white.bold, text: ' ERROR '};
    },
};


function fullWidthLine(left: string, right: string) {
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

function logFormat(info: TransformableInfo) {
    const levelMarker = levelMarkers[info.level]();
    if (info.level === 'debug') {
        if (info.law) {
            return fullWidthLine(`${levelMarker} ${info.message}`, c.grey(`${info.law}`));
        }
        return `${levelMarker} ${info.message}`;
    }

    const indent = ' '.repeat(levelMarker.text.length - 1) + levelMarker.color(' ');
    const indentedMessage = info.message.replace(/\n/g, `\n${indent} `);

    return `\n${levelMarker.color(levelMarker.text)} ${indentedMessage}`;
}

const logger = createLogger({
    level: 'info',
    exitOnError: false,
    transports: [
        new transports.Console({
            format: format.combine(
                format.printf(logFormat),
            ),
        }),
    ],
});

export { logger, Logger };
