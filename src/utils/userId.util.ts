import Counter from "../models/counter.model";

export type UserRole = "ADMIN" | "TRAINER" | "CUSTOMER";

const rolePrefixes: Record<UserRole, string> = {
  ADMIN: "ADM",
  TRAINER: "TRN",
  CUSTOMER: "CUS",
};

export const generateUserId = async (
  role: UserRole
): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { _id: `user_${role}` },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return `${rolePrefixes[role]}-${String(counter.seq).padStart(4, "0")}`;
};
