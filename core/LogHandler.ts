const fs = require('fs');
const path = require('path');
// 代理 console.log，将日志输出到控制台和文件

class LogHandler {
    private static originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
    };

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
    }

    static log(...args) {
        LogHandler.writeToFile('LOG', ...args);
        LogHandler.originalConsole.log(...args);
    }

    static error(...args) {
        LogHandler.writeToFile('ERROR', ...args);
        LogHandler.originalConsole.error(...args);
    }

    static warn(...args) {
        LogHandler.writeToFile('WARN', ...args);
        LogHandler.originalConsole.warn(...args);
    }

    static info(...args) {
        LogHandler.writeToFile('INFO', ...args);
        LogHandler.originalConsole.info(...args);
    }

    static debug(...args) {
        LogHandler.writeToFile('DEBUG', ...args);
        LogHandler.originalConsole.debug(...args);
    }

    static writeToFile(level: string, ...args: any[]) {
        const timestamp = new Date().toISOString();
        const message = `[${level}][${timestamp}]: ${args.join(' ')}\n`;
        if (!fs.existsSync(LogHandler.logFile)) {
            fs.mkdirSync(path.dirname(LogHandler.logFile), { recursive: true });
            fs.writeFileSync(LogHandler.logFile, '', 'utf8');
        }
        fs.appendFileSync(LogHandler.logFile, message, 'utf8');
    }

    static instance: LogHandler;
    static logFile: string;
}

LogHandler.logFile = path.join('Logs', `XXMMLog${new Date().toISOString().replace(/:/g, '-').slice(0, 16)}.log`);
// 如果已经存在日志文件，则删除
if (fs.existsSync(LogHandler.logFile)) {
    fs.unlinkSync(LogHandler.logFile);
}
// 如果日志文件夹内的文件数量超过 10 个，则删除最旧的文件
const logDir = path.dirname(LogHandler.logFile);
while (fs.readdirSync(logDir).map(file => path.join(logDir, file)).length > 10) {
    const logFiles = fs.readdirSync(logDir).map(file => path.join(logDir, file));
    logFiles.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
    fs.unlinkSync(logFiles[0]);
}
LogHandler.init();
LogHandler.log('LogHandler init');

export default LogHandler;
