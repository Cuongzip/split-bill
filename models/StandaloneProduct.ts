import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStandaloneProductDoc extends Document {
  id: string;
  name: string;
  price: number;
  participantIds: string[];
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StandaloneProductSchema = new Schema<IStandaloneProductDoc>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên sản phẩm riêng"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Vui lòng nhập giá"],
      min: 0,
    },
    participantIds: {
      type: [String],
      default: [],
    },
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

StandaloneProductSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

const StandaloneProduct: Model<IStandaloneProductDoc> =
  mongoose.models.StandaloneProduct ||
  mongoose.model<IStandaloneProductDoc>(
    "StandaloneProduct",
    StandaloneProductSchema
  );

export default StandaloneProduct;
