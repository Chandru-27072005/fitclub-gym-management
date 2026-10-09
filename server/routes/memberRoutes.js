
const express = require("express");
const mongoose = require("mongoose");
const Member = require("../models/Member");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

// GET: All members
router.get("/", async (req, res) => {
  try {
    
       await Member.updateMany(
         {
           membershipEndDate: { $lt: new Date() },
           status: { $ne: "Expired" },
         },
         {
           $set: { status: "Expired" },
         }
       );

    const members = await Member.find().sort({ createdAt: -1 });
    res.json({ success: true, count: members.length, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch members" });
  }
});

// POST: Add a member
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, plan } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    const member = await Member.create({ name, email, phone, plan });
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Failed to create member" });
  }
});

// PUT: Update a member
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid member ID" });
    }

    const allowed = ["name", "email", "phone", "plan", "status"];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    res.json({ success: true, data: member });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE: Remove a member
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid member ID" });
    }

    const member = await Member.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    res.json({ success: true, message: "Member deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete member" });
  }
});


router.patch("/:id/renew", async (req, res) => {
  try {
    const { id } = req.params;
    const { durationMonths = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    const months = Number(durationMonths);

    if (!Number.isInteger(months) || months < 1 || months > 12) {
      return res.status(400).json({
        success: false,
        message: "Duration must be between 1 and 12 months",
      });
    }

    const member = await Member.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const now = new Date();
    const currentEndDate = member.membershipEndDate
      ? new Date(member.membershipEndDate)
      : now;

    const startDate = currentEndDate > now ? currentEndDate : now;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    member.membershipStartDate = startDate;
    member.membershipEndDate = endDate;
    member.status = "Active";

    await member.save();

    return res.json({
      success: true,
      message: "Membership renewed successfully",
      data: member,
    });
  } catch (error) {
    console.error("Membership renewal error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to renew membership",
    });
  }
});


module.exports = router;
