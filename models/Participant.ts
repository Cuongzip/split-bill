import mongoose, { Schema, Document, Model } from "mongoose";

export interface IParticipantDoc extends Document {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipantDoc>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên thành viên"],
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "bg-emerald-500 text-white",
    },
  },
  {
    timestamps: true,
  }
);

ParticipantSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

const Participant: Model<IParticipantDoc> =
  mongoose.models.Participant ||
  mongoose.model<IParticipantDoc>("Participant", ParticipantSchema);

export default Participant;
