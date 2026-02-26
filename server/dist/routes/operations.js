"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const operations_1 = require("../controllers/operations");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/data', auth_1.requireAuth, operations_1.getOperationsData);
exports.default = router;
