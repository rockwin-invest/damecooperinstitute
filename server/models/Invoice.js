// ============================================================
// Invoice model
// ------------------------------------------------------------
// Each document is one line item on a student's fee statement.
// ============================================================

const { mongoose } = require("../db");

const invoiceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      default: "NZD",
      uppercase: true,
      trim: true
    },
    dueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ["paid", "due", "overdue", "waived"],
      default: "due",
      index: true
    },
    paidAt: { type: Date, default: null }
  },
  { timestamps: true, collection: "invoices" }
);

invoiceSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  // Format dates as ISO yyyy-mm-dd for the frontend
  obj.dueDate = obj.dueDate ? obj.dueDate.toISOString().slice(0, 10) : null;
  return obj;
};

module.exports = mongoose.model("Invoice", invoiceSchema);