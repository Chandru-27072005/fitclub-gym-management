
const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    plan: {
      type: String,
      enum: ["Basic", "Standard", "Premium"],
      default: "Standard",
    },
    status: {
      type: String,
      enum: ["Active", "Pending", "Expired"],
      default: "Active",
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    membershipStartDate: {
      type: Date,
      default: Date.now,
    },
    membershipEndDate: {
      type: Date,
      default: function () {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      return endDate;
    },
},

  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);
