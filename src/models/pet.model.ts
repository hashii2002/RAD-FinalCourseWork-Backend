import { Schema, model } from "mongoose";

export interface IPet {
  _id: string;
  name: string;
  species: string;
  breed: string;
  ageMonths: number;
  price: number;
  description?: string;
  imageUrl?: string;
  status: "AVAILABLE" | "SOLD" | "RESERVED";
}

const petSchema = new Schema<IPet>(
  {
    _id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: [true, "Pet name is required"],
      trim: true,
    },

    species: {
      type: String,
      required: [true, "Pet species is required"],
      trim: true,
    },

    breed: {
      type: String,
      required: [true, "Pet breed is required"],
      trim: true,
    },

    ageMonths: {
      type: Number,
      required: [true, "Pet age is required"],
      min: [0, "Age cannot be negative"],
    },

    price: {
      type: Number,
      required: [true, "Pet price is required"],
      min: [0, "Price cannot be negative"],
    },

    description: {
      type: String,
      trim: true,
    },

    imageUrl: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "SOLD", "RESERVED"],
      default: "AVAILABLE",
    },
  },
  {
    timestamps: true,
  }
);

const Pet = model<IPet>("Pet", petSchema, "pets");

export default Pet;
