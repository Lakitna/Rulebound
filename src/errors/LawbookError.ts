export class LawbookError extends Error {
    constructor(...message: string[]) {
        super(message.join(' '));

        this.name = 'LawbookError';
    }
}
