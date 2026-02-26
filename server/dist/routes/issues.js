"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const issues_1 = require("../controllers/issues");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Use optionalAuth to capture the citizen identity if logged in
router.post('/', auth_1.optionalAuth, upload.single('image'), issues_1.reportIssue);
router.post('/validate', upload.single('image'), issues_1.validateIssueImage);
router.get('/', auth_1.requireAuth, issues_1.getIssues);
router.patch('/:id/status', auth_1.requireAuth, issues_1.updateStatus);
// New Workflow Routes
router.post('/:id/proof', auth_1.requireAuth, upload.single('image'), issues_1.submitProof);
router.post('/:id/verify', auth_1.requireAuth, issues_1.verifyIssue);
exports.default = router;
