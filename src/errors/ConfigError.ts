export class ConfigError extends Error {
    constructor(...message: string[]) {
        super(message.join(' '));

        this.name = `ConfigError`;
    }
}
