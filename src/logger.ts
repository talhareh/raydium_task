export class Logger {
    private getTimestamp(): string {
        return new Date().toISOString();
    }

    public info(message: string): void {
        console.log(`[${this.getTimestamp()}] INFO: ${message}`);
    }

    public error(message: string): void {
        console.error(`[${this.getTimestamp()}] ERROR: ${message}`);
    }

    public warn(message: string): void {
        console.warn(`[${this.getTimestamp()}] WARN: ${message}`);
    }

    public debug(message: string): void {
        console.debug(`[${this.getTimestamp()}] DEBUG: ${message}`);
    }
}