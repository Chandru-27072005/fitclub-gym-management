
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [1, "Amount must be greater than zero"],
    },
    method: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Failed"],
      default: "Paid",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    receiptNumber: {
      type: String,
      unique: true,
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
