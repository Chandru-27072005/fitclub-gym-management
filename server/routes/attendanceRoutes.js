
const express = require("express");
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Member = require("../models/Member");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// GET: Attendance history (optional date filter)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    const date = req.query.date;

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must use YYYY-MM-DD format",
      });
    }

    if (date) filter.date = date;

    const records = await Attendance.find(filter)
      .populate("member", "name email phone plan")
      .sort({ checkIn: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
});

// GET: Today's attendance summary
router.get("/summary/today", async (req, res) => {
  try {
    const date = todayString();
    const [total, checkedIn, completed] = await Promise.all([
      Attendance.countDocuments({ date }),
      Attendance.countDocuments({ date, status: "Present" }),
      Attendance.countDocuments({ date, status: "Completed" }),
    ]);

    res.json({
      success: true,
      date,
      total,
      checkedIn,
      completed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary",
    });
  }
});

// POST: Check in a member
router.post("/check-in", async (req, res) => {
  try {
    const { memberId } = req.body;

    if (!mongoose.isValidObjectId(memberId)) {
      return res.status(400).json({
        success: false,
        message: "A valid memberId is required",
      });
    }

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    if (member.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Only active members can check in",
      });
    }

    const date = todayString();
    const existing = await Attendance.findOne({ member: memberId, date });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Attendance already exists for this member today",
      });
    }

    const attendance = await Attendance.create({
      member: memberId,
      date,
      checkIn: new Date(),
      status: "Present",
    });

    const populated = await attendance.populate(
      "member",
      "name email phone plan"
    );

    res.status(201).json({
      success: true,
      message: "Member checked in successfully",
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance already exists for this member today",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to check in member",
    });
  }
});

// PATCH: Check out a member
router.patch("/:id/check-out", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
    }

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    if (attendance.checkOut) {
      return res.status(409).json({
        success: false,
        message: "Member has already checked out",
      });
    }

    attendance.checkOut = new Date();
    attendance.status = "Completed";
    await attendance.save();
    await attendance.populate("member", "name email phone plan");

    res.json({
      success: true,
      message: "Member checked out successfully",
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check out member",
    });
  }
});

module.exports = router;
