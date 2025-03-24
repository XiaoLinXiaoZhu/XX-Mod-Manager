const fs = require('fs');
const path = require('path');

class LogHandler {
    private static originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
    };

    private static logBuffer: string[] = [];
    private static flushInterval: NodeJS.Timeout;

    constructor() {
        console.error('LogHandler cannot be instantiated');
        throw new Error('LogHandler cannot be instantiated');
    }

    static init() {
        console.log('LogHandler init');

        console.log = LogHandler.log;
        console.error = LogHandler.error;
        console.warn = LogHandler.warn;
        console.info = LogHandler.info;
        console.debug = LogHandler.debug;

        // Start periodic flushing
        LogHandler.flushInterval = setInterval(() => {
            LogHandler.flushBuffer();
        }, 10000);

        // Flush logs on exit
        process.on('exit', () => LogHandler.flushBuffer());
        process.on('SIGINT', () => {
            LogHandler.flushBuffer();
            process.exit();
        });
    }

    static log(...args) {
        LogHandler.writeToBuffer('LOG', ...args);
        LogHandler.originalConsole.log(...args);
    }

    static error(...args) {
        LogHandler.writeToBuffer('ERROR', ...args);
        LogHandler.originalConsole.error(...args);
    }

    static warn(...args) {
        LogHandler.writeToBuffer('WARN', ...args);
        LogHandler.originalConsole.warn(...args);
    }

    static info(...args) {
        LogHandler.writeToBuffer('INFO', ...args);
        LogHandler.originalConsole.info(...args);
    }

    static debug(...args) {
        LogHandler.writeToBuffer('DEBUG', ...args);
        LogHandler.originalConsole.debug(...args);
    }

    static writeToBuffer(level: string, ...args: any[]) {
        const timestamp = new Date().toISOString();
        const message = `[${level}][${timestamp}]: ${args.join(' ')}\n`;
        LogHandler.logBuffer.push(message);
    }

    static flushBuffer() {
        if (LogHandler.logBuffer.length === 0) return;

        const logDir = path.dirname(LogHandler.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logData = LogHandler.logBuffer.join('');
        fs.appendFileSync(LogHandler.logFile, logData, 'utf8');
        LogHandler.logBuffer = [];
    }

    static instance: LogHandler;
    static logFile: string;
}

LogHandler.logFile = path.join('Logs', `XXMMLog${new Date().toISOString().replace(/:/g, '-').slice(0, 16)}.log`);

// If the log file already exists, delete it
if (fs.existsSync(LogHandler.logFile)) {
    fs.unlinkSync(LogHandler.logFile);
}

// If the number of files in the log directory exceeds 10, delete the oldest files
const logDir = path.dirname(LogHandler.logFile);
if (fs.existsSync(logDir)) {
    while (fs.readdirSync(logDir).map(file => path.join(logDir, file)).length > 10) {
        const logFiles = fs.readdirSync(logDir).map(file => path.join(logDir, file));
        logFiles.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
        fs.unlinkSync(logFiles[0]);
    }
}

LogHandler.init();
LogHandler.log('LogHandler init');

export default LogHandler;
