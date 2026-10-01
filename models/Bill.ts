import mongoose, { Schema, Document, Model } from "mongoose";

export interface IParticipant {
  userId?: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  paid: boolean;
}

export interface IBill extends Document {
  title: string;
  totalAmount: number;
  payerName: string;
  payerId?: mongoose.Types.ObjectId;
  splitType: "EQUAL" | "EXACT" | "PERCENTAGE";
  participants: IParticipant[];
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, default: 0 },
    paid: { type: Boolean, default: false },
  },
  { _id: false }
);

const BillSchema = new Schema<IBill>(
  {
    title: {
      type: String,
      required: [true, "Vui lòng nhập tiêu đề hoá đơn"],
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, "Vui lòng nhập tổng số tiền"],
      min: [0, "Số tiền không thể âm"],
    },
    payerName: {
      type: String,
      required: [true, "Vui lòng nhập tên người thanh toán"],
      trim: true,
    },
    payerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    splitType: {
      type: String,
      enum: ["EQUAL", "EXACT", "PERCENTAGE"],
      default: "EQUAL",
    },
    participants: {
      type: [ParticipantSchema],
      default: [],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Bill: Model<IBill> =
  mongoose.models.Bill || mongoose.model<IBill>("Bill", BillSchema);

export default Bill;
