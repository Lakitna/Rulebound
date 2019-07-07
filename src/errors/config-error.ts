export class ConfigError extends Error {
    public constructor(...message: string[]) {
        super(message.join(' '));

        this.name = `ConfigError`;
    }
}
