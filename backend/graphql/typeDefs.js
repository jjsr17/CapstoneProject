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
  }

  type Query {
    ping: String!
    debugSchemaVersion: String!
    bookingsByStudent(studentId: ID!): [BookingEvent!]!
    bookingsByTutor(tutorId: ID!): [BookingEvent!]!
    userById(id: ID!): User
    tutorProfileByUserId(userId: ID!): TutorProfile
  }
`;
