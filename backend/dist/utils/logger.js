"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDebug = exports.logWarn = exports.logInfo = exports.logError = exports.logStream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.prettyPrint());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss'
}), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
}));
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'tcf-tef-api' },
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat
    }));
}
exports.logStream = {
    write: (message) => {
        exports.logger.info(message.trim());
    }
};
const logError = (error, context) => {
    exports.logger.error('Error occurred', {
        message: error.message,
        stack: error.stack,
        context
    });
};
exports.logError = logError;
const logInfo = (message, meta) => {
    exports.logger.info(message, meta);
};
exports.logInfo = logInfo;
const logWarn = (message, meta) => {
    exports.logger.warn(message, meta);
};
exports.logWarn = logWarn;
const logDebug = (message, meta) => {
    exports.logger.debug(message, meta);
};
exports.logDebug = logDebug;
//# sourceMappingURL=logger.js.map