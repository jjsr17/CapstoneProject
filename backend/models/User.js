// backend/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // Multi-tenant (optional for now)
    tenantId: { type: Number, default: 0 },

    // Account identity
    accountType: { type: String, enum: ["student", "educator"], required: true },

    user_role: { type: String, default: "user" }, // optional (you can remove later)
    user_status: { type: String, default: "active" },

    // Name fields
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },

    // Demographics
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    age: { type: Number, min: 0 },
    birthDate: { type: String, trim: true }, // keep as string for now; you can convert to Date later

    // Address
    address: { type: String, trim: true },
    town: { type: String, trim: true },
    stateField: { type: String, trim: true },
    country: { type: String, trim: true },

    // Contact
    phone: { type: String, trim: true },

    // Login
    user_email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String }, // store hashed password later (NOT plain password)

    // Student fields
    student: {
      schoolName: { type: String, trim: true },
      educationLevel: { type: String, enum: ["school", "college", ""], default: "" },
      grade: { type: String, trim: true },
      collegeYear: { type: String, trim: true },
      concentration: { type: String, trim: true },
      degreeType: { type: String, trim: true }, // Associate/Bachelor/Master
    },

    // Educator fields
    educator: {
      collegeName: { type: String, trim: true },
      degree: { type: String, trim: true }, // Bachelor/Master/Doctorate
      concentration: { type: String, trim: true },
      credentialsFileName: { type: String, trim: true }, // store filename for now
      // Later: credentialsUrl, storageId, etc.
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
