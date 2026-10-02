import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBillProduct {
  id: string;
  name: string;
  price: number;
  participantIds: string[];
}

export interface IBill extends Document {
  id: string;
  sessionId: string;
  title: string;
  date?: string;
  image?: string;
  totalAmount?: number;
  products: IBillProduct[];
  createdAt: Date;
  updatedAt: Date;
}

const BillProductSchema = new Schema<IBillProduct>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    participantIds: { type: [String], default: [] },
  },
  { _id: false }
);

const BillSchema = new Schema<IBill>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      default: "default",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Vui lòng nhập tiêu đề hoá đơn"],
      trim: true,
    },
    date: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    image: {
      type: String,
      default: "",
    },
    totalAmount: {
      type: Number,
      default: null,
    },
    products: {
      type: [BillProductSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

BillSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

const Bill: Model<IBill> =
  mongoose.models.Bill || mongoose.model<IBill>("Bill", BillSchema);

export default Bill;
