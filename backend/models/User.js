const mongoose = require("mongoose");


const UserSchema = new mongoose.Schema(
  {
    tenantId: { type: Number, default: 0 },

    // ✅ Auth identity
    authProvider: { type: String, enum: ["local", "microsoft"], default: "local" },

    // ✅ Microsoft stable id (oid claim)
    msOid: { type: String, unique: true, sparse: true, index: true },
    // ✅ Microsoft principal name (email used in Entra / Azure AD)
    msUpn: { type: String, trim: true, index: true },

    // ✅ Is this user allowed to host Teams meetings?
    teamsEnabled: { type: Boolean, default: false },

    // Optional but useful
    timeZone: { type: String, default: "America/Puerto_Rico" },

    // ✅ Whether your app profile is finished
    profileComplete: { type: Boolean, default: false },

    // Account identity (❗not required anymore for SSO shell)
    accountType: { type: String, enum: ["student", "educator"] },

    user_role: { type: String, default: "user" },
    user_status: { type: String, default: "active" },

    // Name fields (❗not required anymore for SSO shell)
    firstName: { type: String, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, trim: true },

    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    age: { type: Number, min: 0 },
    birthDate: { type: String, trim: true },

    address: { type: String, trim: true },
    town: { type: String, trim: true },
    stateField: { type: String, trim: true },
    country: { type: String, trim: true },

    phone: { type: String, trim: true },

    // Login (❗not required anymore + sparse unique)
    user_email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },

    passwordHash: { type: String },

    student: {
      schoolName: { type: String, trim: true },
      educationLevel: { type: String, enum: ["school", "college", ""], default: "" },
      grade: { type: String, trim: true },
      collegeYear: { type: String, trim: true },
      concentration: { type: String, trim: true },
      degreeType: { type: String, trim: true },
    },

    educator: {
      collegeName: { type: String, trim: true },
      degree: { type: String, trim: true },
      concentration: { type: String, trim: true },
      credentialsFileName: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
