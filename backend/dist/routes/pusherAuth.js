"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const pusher_1 = __importDefault(require("pusher"));
const router = express_1.default.Router();
const pusher = new pusher_1.default({
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || '',
    useTLS: true
});
router.post('/auth', auth_1.authenticate, async (req, res) => {
    try {
        const { socket_id, channel_name } = req.body;
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }
        const userId = req.user.userId || req.user.id;
        if (!socket_id || !channel_name) {
            return res.status(400).json({
                error: 'Missing socket_id or channel_name'
            });
        }
        const isPrivateChannel = channel_name.startsWith('private-');
        const isPresenceChannel = channel_name.startsWith('presence-');
        if (!isPrivateChannel && !isPresenceChannel) {
            return res.status(403).json({
                error: 'Channel must be private or presence'
            });
        }
        let userInfo = {};
        if (isPresenceChannel) {
            try {
                const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                });
                if (user) {
                    userInfo = {
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                        email: user.email
                    };
                }
                else {
                    userInfo = {
                        name: req.user.email,
                        email: req.user.email
                    };
                }
            }
            catch (dbError) {
                userInfo = {
                    name: req.user.email,
                    email: req.user.email
                };
            }
        }
        let authResponse;
        if (isPresenceChannel) {
            authResponse = pusher.authorizeChannel(socket_id, channel_name, {
                user_id: userId,
                user_info: userInfo
            });
        }
        else {
            authResponse = pusher.authorizeChannel(socket_id, channel_name);
        }
        res.json(authResponse);
    }
    catch (error) {
        console.error('Pusher auth error:', error);
        console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            userId: req.user?.userId,
            channelName: req.body?.channel_name
        });
        res.status(500).json({
            error: 'Authentication failed',
            message: error?.message || 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=pusherAuth.js.map