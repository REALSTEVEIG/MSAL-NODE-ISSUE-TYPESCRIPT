interface AccessToken {
    user: string;
    email: string;
    aid: string;
    accessToken: string;
    refreshToken: string;
    provider: string;
    createdAt: Date;
    expiryTime: Date;
  }

  import mongoose from 'mongoose';

const { Schema } = mongoose;

const AccessTokenSchema = new Schema<AccessToken>(
  {
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
  },
  { timestamps: true },
);

const AccessTokenModel = mongoose.model<AccessToken>(
  'AccessToken',
  AccessTokenSchema,
);

export default AccessTokenModel;
