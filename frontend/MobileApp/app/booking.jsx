import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

const params = useLocalSearchParams();
console.log("BOOKING PARAMS", params);

export default function Booking() {
  const { courseId } = useLocalSearchParams(); // ✅ THIS replaces URL params
  const [course, setCourse] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) {
      Alert.alert("Error", "No course selected.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        // 🔴 Use FULL IP, not /api
        const courseRes = await fetch(`http://192.168.4.30:5000/api/courses/${courseId}`);
        const courseData = await courseRes.json();
        setCourse(courseData);

        const slotsRes = await fetch(
          `http://192.168.4.30:5000/api/courses/${courseId}/available-slots?daysAhead=14`
        );
        const slotsData = await slotsRes.json();
        setAvailableSlots(slotsData.availableSlots || []);
      } catch (e) {
        Alert.alert("Error", "Failed to load course");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [courseId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  if (!course) return <Text>Course not found.</Text>;

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>
        {course.courseName}
      </Text>

      <Text style={{ color: "#666", marginVertical: 6 }}>
        {course.subject} · {course.type === "tutoring" ? "Course Tutoring" : "Discussion"}
      </Text>

      <Text>{course.description}</Text>

      <Text style={{ marginTop: 20, fontWeight: "600" }}>
        Available Sessions (60 min)
      </Text>

      {availableSlots.map((slot, idx) => (
        <TouchableOpacity
          key={idx}
          style={{
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginTop: 10,
            backgroundColor:
              selectedSlot?.start === slot.start ? "#e8ddff" : "#fff",
          }}
          onPress={() => setSelectedSlot(slot)}
        >
          <Text>{new Date(slot.start).toLocaleTimeString()}</Text>
          <Text>{slot.mode === "IRL" ? "In person" : "Online"}</Text>
        </TouchableOpacity>
      ))}

      {selectedSlot && (
        <TouchableOpacity
          style={{
            marginTop: 20,
            padding: 16,
            backgroundColor: "#000",
            borderRadius: 8,
          }}
          onPress={() => Alert.alert("Booked (stub)")}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            Book Session
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
