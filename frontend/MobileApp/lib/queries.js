// MobileApp/lib/queries.js
import { gql } from "@apollo/client";

export const SESSIONS_BY_STUDENT = gql`
  query SessionsByStudent($studentId: ID!) {
    sessionsByStudent(studentId: $studentId) {
      _id
      title
      start
      end
      bookingId
      roomId
      mode
    }
  }
`;

export const SESSIONS_BY_TUTOR = gql`
  query SessionsByTutor($tutorId: ID!) {
    sessionsByTutor(tutorId: $tutorId) {
      _id
      title
      start
      end
      bookingId
      roomId
      mode
    }
  }
`;
