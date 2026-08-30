import type { Request, Response } from "express";
import NewsletterSubscriber from "../models/NewsletterSubscriber";

export const subscribeNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, source } = req.body;

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await NewsletterSubscriber.findOne({ email: normalizedEmail });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.subscribedAt = new Date();
        await existing.save();
      }
      res.status(200).json({
        success: true,
        message: "You are already subscribed to our newsletter!",
        alreadySubscribed: true,
      });
      return;
    }

    const subscriber = await NewsletterSubscriber.create({
      email: normalizedEmail,
      source: source || "footer",
      isActive: true,
      subscribedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Thank you! You have been successfully subscribed to our newsletter.",
      data: {
        id: subscriber._id,
        email: subscriber.email,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(200).json({
        success: true,
        message: "You are already subscribed to our newsletter!",
        alreadySubscribed: true,
      });
      return;
    }
    console.error("Newsletter subscription error:", error);
    res.status(500).json({ success: false, message: "Failed to process newsletter subscription." });
  }
};
