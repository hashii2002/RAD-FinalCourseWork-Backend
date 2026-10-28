import { Request, Response } from "express";
import CompanyContact from "../models/company-contact.model";

export const getCompanyContact = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    const companyContact = await CompanyContact.findOne().lean();

    if (!companyContact) {
      res.status(404).json({
        success: false,
        message: "Company contact details have not been configured",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Company contact details retrieved successfully",
      data: companyContact,
    });
  } catch (error) {
    console.error("Get company contact error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve company contact details",
    });
  }
};

const allowedFields = [
  "companyName",
  "address",
  "phone",
  "email",
  "openingHours",
  "website",
  "facebook",
  "instagram",
] as const;

const isAdmin = (req: Request): boolean => {
  return req.user?.role === "ADMIN";
};

const getContactPayload = (
  body: Record<string, unknown>
): Record<string, string> | null => {
  const payload: Record<string, string> = {};

  for (const field of allowedFields) {
    const value = body[field];

    if (value !== undefined) {
      if (typeof value !== "string") {
        return null;
      }

      payload[field] = value.trim();
    }
  }

  return payload;
};

export const createCompanyContact = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        message: "Only administrators can create company contact details",
      });
      return;
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      res.status(400).json({
        success: false,
        message: "A valid JSON object is required",
      });
      return;
    }

    const payload = getContactPayload(
      req.body as Record<string, unknown>
    );

    if (!payload) {
      res.status(400).json({
        success: false,
        message: "Contact fields must contain string values",
      });
      return;
    }

    const requiredFields = [
      "companyName",
      "address",
      "phone",
      "email",
      "openingHours",
    ];

    const missingFields = requiredFields.filter(
      (field) =>
        typeof payload[field] !== "string" ||
        payload[field].trim() === ""
    );

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: "Required company contact fields are missing",
        fields: missingFields,
      });
      return;
    }

    const existingContact = await CompanyContact.findOne();

    if (existingContact) {
      res.status(409).json({
        success: false,
        message:
          "Company contact details already exist. Use PUT to update them.",
      });
      return;
    }

    const companyContact = await CompanyContact.create(payload);

    res.status(201).json({
      success: true,
      message: "Company contact details created successfully",
      data: companyContact,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "ValidationError"
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Create company contact error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create company contact details",
    });
  }
};

export const updateCompanyContact = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        message: "Only administrators can update company contact details",
      });
      return;
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      res.status(400).json({
        success: false,
        message: "A valid JSON object is required",
      });
      return;
    }

    const payload = getContactPayload(
      req.body as Record<string, unknown>
    );

    if (!payload) {
      res.status(400).json({
        success: false,
        message: "Contact fields must contain string values",
      });
      return;
    }

    if (Object.keys(payload).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
      return;
    }

    const companyContact = await CompanyContact.findOneAndUpdate(
      {},
      { $set: payload },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!companyContact) {
      res.status(404).json({
        success: false,
        message:
          "Company contact details do not exist. Use POST to create them first.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Company contact details updated successfully",
      data: companyContact,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "ValidationError"
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Update company contact error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update company contact details",
    });
  }
};
