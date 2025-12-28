import mongoose from "mongoose";

const StudentProfileSchema = new mongoose.Schema(
  {
    schoolName: { type: String, trim: true },
    educationLevel: { type: String, enum: ["school", "college", ""], default: "" },
    grade: { type: String, trim: true }, // for school
    collegeYear: { type: String, trim: true }, // for college
    concentration: { type: String, trim: true }, // for college
    degreeType: { type: String, enum: ["Associate", "Bachelor", "Master", ""], default: "" },
  },
  { _id: false }
);

const EducatorProfileSchema = new mongoose.Schema(
  {
    collegeName: { type: String, trim: true },
    degree: { type: String, enum: ["Bachelor", "Master", "Doctorate", ""], default: "" },
    concentration: { type: String, trim: true },

    // Store a file reference (recommended) instead of raw PDF bytes
    credentialsPdf: {
      fileName: { type: String, default: "" },
      mimeType: { type: String, default: "application/pdf" },
      url: { type: String, default: "" }, // e.g. S3/Cloudinary URL
      uploadedAt: { type: Date },
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    // Name
    firstName: { type: String, trim: true, required: true },
    middleName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, required: true },

    // Demographics
    gender: { type: String, enum: ["Male", "Female", ""], default: "" },
    age: { type: Number, min: 0, max: 130 }, // optional
    birthDate: { type: String, trim: true, default: "" }, // keep as string for now (MM/DD/YYYY)

    // Address
    address: { type: String, trim: true, default: "" },
    town: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },

    // Contact
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, required: true, lowercase: true, unique: true },

    // Account type
    accountType: { type: String, enum: ["student", "educator"], required: true },

    // Role-specific profiles
    studentProfile: { type: StudentProfileSchema, default: undefined },
    educatorProfile: { type: EducatorProfileSchema, default: undefined },

    // Auth (local + Microsoft)
    authProvider: { type: String, enum: ["local", "microsoft"], default: "local" },
    passwordHash: { type: String, default: "" }, // only for local
    microsoft: {
      accountId: { type: String, default: "" }, // result.account.homeAccountId
      tenantId: { type: String, default: "" },
      username: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Optional: enforce profile presence based on type
UserSchema.pre("validate", function (next) {
  if (this.accountType === "student") {
    this.educatorProfile = undefined;
    if (!this.studentProfile) this.studentProfile = {};
  } else if (this.accountType === "educator") {
    this.studentProfile = undefined;
    if (!this.educatorProfile) this.educatorProfile = {};
  }
  next();
});

export default mongoose.model("User", UserSchema);
