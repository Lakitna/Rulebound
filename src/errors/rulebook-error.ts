export class RulebookError extends Error {
    public constructor(...message: string[]) {
        super(message.join(' '));

        this.name = 'RulebookError';
    }
}
