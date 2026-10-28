
import { Schema, model } from "mongoose";

export interface ICompanyContact {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  website?: string;
  facebook?: string;
  instagram?: string;
}

const companyContactSchema = new Schema<ICompanyContact>(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [150, "Company name cannot exceed 150 characters"],
    },

    address: {
      type: String,
      required: [true, "Company address is required"],
      trim: true,
      maxlength: [300, "Address cannot exceed 300 characters"],
    },

    phone: {
      type: String,
      required: [true, "Company phone number is required"],
      trim: true,
      maxlength: [30, "Phone number cannot exceed 30 characters"],
    },

    email: {
      type: String,
      required: [true, "Company email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid company email address",
      ],
    },

    openingHours: {
      type: String,
      required: [true, "Opening hours are required"],
      trim: true,
      maxlength: [200, "Opening hours cannot exceed 200 characters"],
    },

    website: {
      type: String,
      trim: true,
    },

    facebook: {
      type: String,
      trim: true,
    },

    instagram: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const CompanyContact = model<ICompanyContact>(
  "CompanyContact",
  companyContactSchema,
  "companyContacts"
);

export default CompanyContact;
