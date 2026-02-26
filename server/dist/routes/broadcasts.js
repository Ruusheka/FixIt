"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const broadcasts_1 = require("../controllers/broadcasts");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', auth_1.requireAuth, broadcasts_1.getBroadcasts);
router.post('/', auth_1.requireAuth, broadcasts_1.createBroadcast);
router.post('/:id/read', auth_1.requireAuth, broadcasts_1.markAsRead);
router.patch('/:id', auth_1.requireAuth, broadcasts_1.updateBroadcast);
router.delete('/:id', auth_1.requireAuth, broadcasts_1.deleteBroadcast);
router.get('/:id/analytics', auth_1.requireAuth, broadcasts_1.getBroadcastAnalytics);
exports.default = router;
