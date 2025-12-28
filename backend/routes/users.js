import express from "express";
import User from "../../models/User.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const data = req.body;

    const user = await User.create({
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      gender: data.gender,
      age: data.age ? Number(data.age) : undefined,
      birthDate: data.birthDate,
      address: data.address,
      town: data.town,
      state: data.stateField || data.state,
      country: data.country,
      phone: data.phone,
      email: data.email,
      accountType: data.accountType,

      studentProfile: data.accountType === "student"
        ? {
            schoolName: data.schoolName,
            educationLevel: data.educationLevel,
            grade: data.grade,
            collegeYear: data.collegeYear,
            concentration: data.studentConcentration,
            degreeType: data.degreeType,
          }
        : undefined,

      educatorProfile: data.accountType === "educator"
        ? {
            collegeName: data.educatorCollegeName,
            degree: data.educatorDegree,
            concentration: data.educatorConcentration,
          }
        : undefined,
    });

    res.status(201).json({ ok: true, userId: user._id });
  } catch (err) {
    // duplicate email
    if (err.code === 11000) return res.status(409).json({ ok: false, message: "Email already exists." });
    res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
