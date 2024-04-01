"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const AccessTokenSchema = new Schema({
    user: {
        type: String,
    },
    email: {
        type: String,
    },
    aid: {
        type: String,
    },
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
    },
    provider: {
        type: String,
        required: true,
        enum: ['perizer', 'google', 'zoom', 'microsoft'],
        default: 'perizer',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiryTime: {
        type: Date,
        required: true,
    },
}, { timestamps: true });
const AccessTokenModel = mongoose_1.default.model('AccessToken', AccessTokenSchema);
exports.default = AccessTokenModel;
