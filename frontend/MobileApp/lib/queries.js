// MobileApp/lib/queries.js
import { gql } from "@apollo/client";

export const BOOKINGS_BY_STUDENT = gql`
  query BookingsByStudent($studentId: ID!) {
    bookingsByStudent(studentId: $studentId) {
      _id
      title
      start
      end
      iscompleted
      studentId
      tutorId
    }
  }
`;

export const BOOKINGS_BY_TUTOR = gql`
  query BookingsByTutor($tutorId: ID!) {
    bookingsByTutor(tutorId: $tutorId) {
      _id
      title
      start
      end
      iscompleted
      studentId
      tutorId
    }
  }
`;
