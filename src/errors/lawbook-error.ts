export class LawbookError extends Error {
    public constructor(...message: string[]) {
        super(message.join(' '));

        this.name = 'LawbookError';
    }
}
