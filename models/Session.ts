import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  id: string;
  name: string;
  date?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên nhóm"],
      trim: true,
    },
    date: {
      type: String,
      default: () =>
        new Date().toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
    color: {
      type: String,
      default: "bg-blue-500",
    },
  },
  {
    timestamps: true,
  }
);

SessionSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;
