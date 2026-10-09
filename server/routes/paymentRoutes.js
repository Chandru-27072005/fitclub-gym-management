
const express = require("express");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Member = require("../models/Member");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

// GET /api/payments - Payment history
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("member", "name email phone plan")
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Payment history error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load payment history",
    });
  }
});

// GET /api/payments/summary - Payment summary
router.get("/summary", async (req, res) => {
  try {
    const summary = await Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    const result = {
      totalPayments: 0,
      totalCollected: 0,
      pendingAmount: 0,
      failedPayments: 0,
    };

    summary.forEach((item) => {
      result.totalPayments += item.count;

      if (item._id === "Paid") {
        result.totalCollected += item.amount;
      } else if (item._id === "Pending") {
        result.pendingAmount += item.amount;
      } else if (item._id === "Failed") {
        result.failedPayments += item.count;
      }
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Payment summary error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load payment summary",
    });
  }
});

// POST /api/payments - Record a payment
router.post("/", async (req, res) => {
  try {
    const { memberId, amount, method, status = "Paid", transactionId = "", notes = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(memberId || "")) {
      return res.status(400).json({
        success: false,
        message: "Select a valid member",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    if (!["Cash", "UPI", "Card", "Bank Transfer"].includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid payment method",
      });
    }

    if (!["Paid", "Pending", "Failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid payment status",
      });
    }

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const receiptNumber = `FIT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const payment = await Payment.create({
      member: member._id,
      amount: numericAmount,
      method,
      status,
      receiptNumber,
      transactionId: String(transactionId).trim(),
      notes: String(notes).trim(),
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate("member", "name email phone plan");

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: populatedPayment,
    });
  } catch (error) {
    console.error("Record payment error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to record payment",
    });
  }
});

// GET /api/payments/:id - Retrieve payment for receipt
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(req.params.id)
      .populate("member", "name email phone plan");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    console.error("Payment receipt lookup error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load payment receipt",
    });
  }
});

module.exports = router;
