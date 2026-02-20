const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type EducatorInfo {
    collegeName: String
    degree: String
    concentration: String
    credentialsFileName: String
  }

  type StudentInfo {
    schoolName: String
    educationLevel: String
    grade: String
    collegeYear: String
    concentration: String
    degreeType: String
  }

  type User {
    _id: ID!
    firstName: String
    middleName: String
    lastName: String
    user_email: String
    accountType: String
    educator: EducatorInfo
    student: StudentInfo

    msOid: String
    msUpn: String 
    teamsEnabled: Boolean
    profileComplete: Boolean!
    authProvider: String
  }

  input CompleteProfileInput {
    accountType: String!
    firstName: String!
    lastName: String!
    phone: String
  }

  type TutorProfile {
    _id: ID!
    userId: ID!
    subjects: [Int!]!
    tutor_rate: String
    tutor_rating: Float
  }

  type BookingEvent {
    _id: ID!
    title: String!
    start: String!
    end: String!
    studentId: ID
    tutorId: ID
    iscompleted: Boolean
    teamsJoinUrl: String
  }

  # -----------------------
  # Courses (NEW)
  # -----------------------
  type AvailabilitySlot {
    days: [String!]!
    startTime: String!
    startAmPm: String!
    endTime: String!
    endAmPm: String!
    mode: String!
    location: String
  }

  type Course {
    _id: ID!
    courseName: String!
    subject: String!
    type: String!
    description: String
    availability: [AvailabilitySlot!]!
  }

  type Query {
    ping: String!
    debugSchemaVersion: String!
    debugSchemaVersion2: String!
    me: User

    userById(id: ID!): User
    tutorProfileByUserId(userId: ID!): TutorProfile

    bookingsByStudent(studentId: ID!): [BookingEvent!]!
    bookingsByTutor(tutorId: ID!): [BookingEvent!]!

    # Courses (NEW)
    courseById(id: ID!): Course
    courses(query: String, subject: String, type: String): [Course!]!
  }

  type Mutation {
    completeProfile(input: CompleteProfileInput!): User!
  }
`;

module.exports = typeDefs;
