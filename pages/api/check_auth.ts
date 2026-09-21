import { NextApiRequest, NextApiResponse } from "next";
import { requireAllowedUser } from "@/libs/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!(await requireAllowedUser(req, res))) return;
  res.status(200).json({ isAllowed: true });
}
