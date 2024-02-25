import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email } = req.body;

  const allowedEmails = process.env.ALLOWED_EMAILS
    ? process.env.ALLOWED_EMAILS.split(",")
    : [];

  const isAllowed = allowedEmails.includes(email);
  console.log(isAllowed);

  res.status(200).json({ isAllowed });
}
