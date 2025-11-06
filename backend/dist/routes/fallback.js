"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/contacts', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 'fallback-1',
                firstName: 'Jeannot',
                lastName: 'Pericles',
                email: 'jeannotpericles@gmail.com',
                role: 'STUDENT',
                profileImage: null,
                status: 'ACTIVE',
                lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
                isOnline: false,
                lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'fallback-2',
                firstName: 'Tima',
                lastName: 'Claude',
                email: 'timaclaude@gmail.com',
                role: 'STUDENT',
                profileImage: null,
                status: 'ACTIVE',
                lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
                isOnline: false,
                lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'fallback-3',
                firstName: 'Stacy',
                lastName: 'Jordan',
                email: 'stacyjordan@gmail.com',
                role: 'JUNIOR_MANAGER',
                profileImage: null,
                status: 'ACTIVE',
                lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
                isOnline: false,
                lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'fallback-4',
                firstName: 'Pericles',
                lastName: 'Ngon',
                email: 'periclesngon01@gmail.com',
                role: 'SENIOR_MANAGER',
                profileImage: null,
                status: 'ACTIVE',
                lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
                isOnline: false,
                lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            }
        ]
    });
});
router.get('/unread-count', (req, res) => {
    res.json({
        success: true,
        data: { count: 0 }
    });
});
router.get('/messages', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});
router.get('/notifications/unread-count', (req, res) => {
    res.json({
        success: true,
        data: { count: 0 }
    });
});
exports.default = router;
//# sourceMappingURL=fallback.js.map