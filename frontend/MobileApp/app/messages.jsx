// MobileApp/app/messages.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function MessagesScreen() {
  const [contacts, setContacts] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [useTeams, setUseTeams] = useState(false);
  const [me, setMe] = useState(null);


  const flatListRef = useRef(null);

  // ✅ Backend base (LAN)
   const API_BASE = useMemo(() => {
      const API_WEB = "http://localhost:5000";
      const API_DEVICE = "http://192.168.4.28:5000";
      return Platform.OS === "web" ? API_WEB : API_DEVICE;
    }, []);
    
  const GRAPHQL_PATH = "/graphql";

const ME_QUERY = `
  query Me {
    me {
      _id
      user_email
      firstName
      lastName
      teamsEnabled
      authProvider
      msOid
      msUpn
    }
  }
`;

async function gqlRequest(API_BASE, token, query, variables) {
  const res = await fetch(`${API_BASE}${GRAPHQL_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.errors?.[0]?.message || `HTTP ${res.status}`);
  if (json?.errors?.length) throw new Error(json.errors[0].message);
  return json?.data;
}

  // Derived boolean (handles true / "true" / 1, etc.)
  const teamsEligible =
    currentConversation?.teamsEligible === true ||
    currentConversation?.teamsEligible === "true" ||
    currentConversation?.teamsEligible === 1;

  async function getUserId() {
    return AsyncStorage.getItem("mongoUserId");
  }

  async function getGraphToken() {
  const graph = await AsyncStorage.getItem("msGraphAccessToken");
  if (graph) return graph;

  // fallback if you only stored msAccessToken
  const access = await AsyncStorage.getItem("msAccessToken");
  return access;
}


  function goBack() {
  router.back();
}


  function normalizeContacts(data) {
    const arr = Array.isArray(data) ? data : [];
    return arr.map((c) => ({
      ...c,
      teamsEligible:
        c?.teamsEligible === true || c?.teamsEligible === "true" || c?.teamsEligible === 1,
    }));
  }

  async function loadContacts() {
    try {
      setLoadingContacts(true);

      const userId = await getUserId();
      if (!userId) {
        console.warn("No mongoUserId in AsyncStorage.");
        setContacts([]);
        return;
      }

      const res = await fetch(`${API_BASE}/api/messages/contacts`, {
        headers: { "x-user-id": userId },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load contacts");

      setContacts(normalizeContacts(data));
    } catch (err) {
      console.error(err);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }

  async function loadMessages(conversationId) {
    if (!conversationId) return;

    try {
      setLoadingMessages(true);

      const userId = await getUserId();
      if (!userId) {
        setMessages([]);
        return;
      }

      const res = await fetch(`${API_BASE}/api/messages/${conversationId}`, {
        headers: { "x-user-id": userId },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load messages");

      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function startWhiteboard() {
    if (!teamsEligible) return;

    const userId = await getUserId();
    if (!userId) {
      Alert.alert("Error", "Missing user id. Please log in again.");
      return;
    }

    const graphToken = await getGraphToken();
   console.log("graphToken exists? (whiteboard)", !!graphToken);
    console.log("teamsEnabled?", me?.teamsEnabled);
    console.log("authProvider?", me?.authProvider);
    console.log("msOid?", me?.msOid);
    console.log("msUpn?", me?.msUpn);

    if (!graphToken) {
      Alert.alert("Missing Graph token", "Please sign in with Microsoft again.");
      return;
    }
    if (!me?.teamsEnabled) {
    Alert.alert(
        "Teams not enabled",
        "This account is not Teams-enabled yet. Sign in with Microsoft again or run completeProfile."
    );
    return;
    }

    const chatId = currentConversation?.teamsChatId;
    if (!chatId) {
      Alert.alert("Error", "No Teams chatId linked to this conversation.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/whiteboard/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          Authorization: `Bearer ${graphToken}`,
        },
        body: JSON.stringify({
          chatId,
          displayName: `Whiteboard - ${currentConversation?.name || "Session"}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Start whiteboard error:", data);
        Alert.alert("Error", data?.error || "Failed to start Whiteboard");
        return;
      }

      Alert.alert("Success", "Whiteboard tab added.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to start Whiteboard");
    }
  }

  async function sendMessage() {
    console.log("SEND pressed", {
      messageText,
      useTeams,
      teamsEligibleRaw: currentConversation?.teamsEligible,
      teamsEligibleComputed: teamsEligible,
      chatId: currentConversation?.teamsChatId,
    });

    if (!messageText.trim() || !currentConversation) return;

    const userId = await getUserId();
    if (!userId) {
      Alert.alert("Error", "Missing user id. Please log in again.");
      return;
    }

    // ✅ Teams path (uses computed boolean)
    if (useTeams && teamsEligible) {
      const graphToken = await getGraphToken();
      console.log("graphToken exists? (send)", !!graphToken);

      if (!graphToken) {
        Alert.alert("Missing Graph token", "Please sign in with Microsoft again.");
        return;
      }

      try {
        console.log("Sending via TEAMS...");

        const res = await fetch(`${API_BASE}/api/messages/send-teams`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
            Authorization: `Bearer ${graphToken}`,
          },
          body: JSON.stringify({
            conversationId: currentConversation.conversationId,
            chatId: currentConversation.teamsChatId,
            text: messageText,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("Teams send error:", data);
          Alert.alert("Error", data?.error || "Teams send failed");
          return;
        }

        setMessageText("");
        await loadMessages(currentConversation.conversationId);
        await loadContacts();
        return;
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Teams send failed");
        return;
      }
    }

    // ✅ In-app path
    console.log("Sending via IN-APP...");
    try {
      const res = await fetch(`${API_BASE}/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          conversationId: currentConversation.conversationId,
          text: messageText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Send failed");

      setMessageText("");
      await loadMessages(currentConversation.conversationId);
      await loadContacts();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to send message.");
    }
  }
 
  useEffect(() => {
  (async () => {
    try {
      const token = await getGraphToken();
      console.log("graphToken exists? (me load)", !!token);

      if (!token) {
        setMe(null);
        return;
      }

      const data = await gqlRequest(API_BASE, token, ME_QUERY);
      setMe(data?.me || null);
      console.log("ME loaded:", data?.me || null);
    } catch (e) {
      console.log("ME load failed:", e?.message || e);
      setMe(null);
    }
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages]);

  const selectedId = currentConversation?.conversationId;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Messages</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        {/* Left: contacts */}
        <View style={styles.contacts}>
          <Text style={styles.sectionTitle}>Contacts</Text>

          {loadingContacts ? (
            <View style={styles.centerRow}>
              <ActivityIndicator />
              <Text style={styles.muted}> Loading…</Text>
            </View>
          ) : contacts.length === 0 ? (
            <Text style={styles.muted}>
              No contacts yet. You’ll see contacts after you book a session.
            </Text>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(c) => String(c.conversationId)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={async () => {
                    setCurrentConversation(item);
                    setUseTeams(false);
                    await loadMessages(item.conversationId);
                  }}
                  style={[
                    styles.contact,
                    selectedId === item.conversationId && styles.contactActive,
                  ]}
                >
                  <Text style={styles.contactName}>{item.name}</Text>
                  {!!item.lastMessageText && (
                    <Text numberOfLines={1} style={styles.contactPreview}>
                      {item.lastMessageText}
                    </Text>
                  )}
                </Pressable>
              )}
            />
          )}
        </View>

        {/* Right: chat */}
        <View style={styles.chat}>
          <View style={styles.messages}>
            {!currentConversation ? (
              <View style={styles.emptyCenter}>
                <Text style={styles.muted}>No conversation selected</Text>
              </View>
            ) : loadingMessages ? (
              <View style={styles.emptyCenter}>
                <ActivityIndicator />
                <Text style={styles.muted}> Loading messages…</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(m, idx) =>
                  String(m._id || `${m.senderId}-${m.createdAt}-${idx}`)
                }
                renderItem={({ item: m }) => (
                  <View
                    style={[
                      styles.bubble,
                      m.sender === "me" ? styles.bubbleSent : styles.bubbleReceived,
                    ]}
                  >
                    <Text style={styles.bubbleText}>{m.text}</Text>
                  </View>
                )}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
              />
            )}
          </View>

          {/* input row */}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, !currentConversation && styles.inputDisabled]}
              placeholder={currentConversation ? "Type a message..." : "Select a contact to chat"}
              value={messageText}
              onChangeText={setMessageText}
              editable={!!currentConversation}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />

            <Pressable
              onPress={sendMessage}
              disabled={!currentConversation}
              style={[styles.sendBtn, !currentConversation && styles.sendBtnDisabled]}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </Pressable>

            {teamsEligible && (
              <View style={styles.teamsRow}>
                <Pressable
                  onPress={() => {
                    setUseTeams((v) => {
                      const next = !v;
                      console.log("useTeams toggled:", next);
                      return next;
                    });
                  }}
                  style={[styles.toggle, useTeams && styles.toggleOn]}
                >
                  <Text style={styles.toggleText}>
                    {useTeams ? "✓ " : ""}Send via Teams
                  </Text>
                </Pressable>

                <Pressable onPress={startWhiteboard} style={styles.whiteboardBtn}>
                  <Text style={styles.whiteboardBtnText}>Start Whiteboard</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f4f4f4",
  },
  backBtnText: { fontSize: 14 },
  title: { fontSize: 18, fontWeight: "700" },

  wrapper: { flex: 1, flexDirection: "row" },

  contacts: {
    width: 160,
    borderRightWidth: 1,
    borderRightColor: "#eee",
    padding: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  muted: { color: "#666" },
  centerRow: { flexDirection: "row", alignItems: "center" },

  contact: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  contactActive: { backgroundColor: "#eaf2ff" },
  contactName: { fontWeight: "700" },
  contactPreview: { fontSize: 12, color: "#666", marginTop: 4 },

  chat: { flex: 1 },
  messages: { flex: 1, padding: 10 },
  emptyCenter: { flex: 1, justifyContent: "center", alignItems: "center" },

  bubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  bubbleSent: { alignSelf: "flex-end", backgroundColor: "#dbeafe" },
  bubbleReceived: { alignSelf: "flex-start", backgroundColor: "#f3f4f6" },
  bubbleText: { fontSize: 14 },

  inputRow: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    marginBottom: 10,
  },
  inputDisabled: { backgroundColor: "#f7f7f7" },

  sendBtn: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#111827",
    marginBottom: 8,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontWeight: "700" },

  teamsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  toggleOn: { backgroundColor: "#dcfce7" },
  toggleText: { fontSize: 12 },

  whiteboardBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  whiteboardBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
