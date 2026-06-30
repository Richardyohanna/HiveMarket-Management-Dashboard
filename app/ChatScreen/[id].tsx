import { Colors } from '../../components/constants/theme';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { shopStore } from "../../hivemarket-shop-dashboard/src/store/shopStore";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { getMessagesApi, markAsRead } from '../../hivemarket-shop-dashboard/src/api/chatApi';
import { chatSocketService } from '../../hivemarket-shop-dashboard/src/api/chatSocket';
import { Message } from '../../hivemarket-shop-dashboard/src/types/chat';


import { useChatStore } from '../../hivemarket-shop-dashboard/src/store/chatStore';
import { userStore } from '../../hivemarket-shop-dashboard/src/store/userStore';

const PRIMARY      = "#008100";
const PRIMARY_SOFT = "#e8f5e9";
const PRIMARY_DARK = "#1a3a1a";

// ─── Local UI message shape ───────────────────────────────────────────────────
type UIMessage = {
  id:      string;
  text:    string;
  sent:    boolean;
  time:    string;
  fileUrl?: string | null;
  fileType?: string | null;    // "image" | "document" | null
  uploading?: boolean;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({
  name, size = 46, uri, isDark,
}: {
  name: string; size?: number; uri?: string; isDark: boolean;
}) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: isDark ? PRIMARY_DARK : PRIMARY_SOFT,
      alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ color: PRIMARY, fontWeight: "800", fontSize: size * 0.35 }}>{initials}</Text>
    </View>
  );
};

// ─── File preview inside a bubble ────────────────────────────────────────────
const FileBubble = ({ fileUrl, fileType, sent }: {
  fileUrl: string; fileType?: string | null; sent: boolean;
}) => {
  if (fileType === "image") {
    return (
      <Image
        source={{ uri: fileUrl }}
        style={{ width: 200, height: 150, borderRadius: 10, marginBottom: 4 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[styles.docBubble, { backgroundColor: sent ? "rgba(255,255,255,0.2)" : "#e2e8f0" }]}>
      <Text style={{ fontSize: 18 }}>📎</Text>
      <Text style={{ fontSize: 12, color: sent ? "#fff" : "#333", flexShrink: 1 }} numberOfLines={1}>
        {fileUrl.split("/").pop()}
      </Text>
    </View>
  );
};

// ─── Chat Detail Screen ───────────────────────────────────────────────────────
export default function ChatDetailScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const theme  = isDark ? Colors.dark : Colors.light;

 // const user = userStore.getState(); // get the current logged-in user's data
  const { id, buyerId, sellerId, fullName, online, avatar, activeTab } = useLocalSearchParams<{
    id: string;
    buyerId: string;
    sellerId: string;
    fullName: string;
    online: string;
    avatar?: string;
    activeTab: string;
  }>();

  const isOnline = online === "true";


  console.log("ChatDetailScreen params:", { id, buyerId, sellerId, fullName, online, avatar }); //"b9267378-7a83-4978-a0b1-da68cb2d1285"

  const shop = shopStore();

  const currentUserId = shop.id;

  const { messages: storeMessages, loading, error } = useChatStore();

  const [uiMessages, setUiMessages] = useState<UIMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [draft,      setDraft]      = useState("");
  const [uploadPct,  setUploadPct]  = useState<number | null>(null);
  const listRef = useRef<FlatList>(null);

  // ── Map backend message → UI shape ─────────────────────────────────────────
   const toUIMessage = useCallback((m: Message): UIMessage => ({
    id:       `${m.conversationId}_${m.messageTime}_${m.senderId}`,
    text:     m.message ?? "",
    sent:     m.senderId === currentUserId,
    time:     new Date(m.messageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    fileUrl:  m.fileUrl ?? null,
    fileType: m.fileUrl
      ? /\.(jpg|jpeg|png|gif|webp)$/i.test(m.fileUrl) ? "image" : "document"
      : null,
  }), [currentUserId]); 

  // ── Load message history ────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      if (!buyerId || !sellerId) return;

      try {
        setMessagesLoading(true);

        const data = await getMessagesApi(buyerId, sellerId);

        console.log("this is the messages data ", data);

        if (!mounted) return;

        await markAsRead(id, currentUserId);

        setUiMessages(data.map(toUIMessage));
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (mounted) {
          setMessagesLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [buyerId, sellerId, currentUserId, id, toUIMessage]);
  
  // ── Sync store → UI state ───────────────────────────────────────────────────
  useEffect(() => {
    if (storeMessages.length > 0) {
     // setUiMessages(storeMessages.map(toUIMessage));
    }
  }, [storeMessages]);

  // ── Subscribe to live messages immediately ──────────────────────────────────
  useEffect(() => {
    // subscribeToMessages returns an unsubscribe fn

    console.log("Subscribing to messages for conversation:", { buyerId, sellerId });

  

    if(chatSocketService.isConnected()) {

      console.log("WebSocket already connected. Subscribing to messages...");
  //  chatSocketService.connect(currentUserId).then(() => {

      //this is for subscribing to incoming messages for this conversation
      chatSocketService.onMessage((incoming: any) => {
      
        console.log("Received message in [id].tsx:", incoming);


        // Filter: only handle messages for THIS conversation
        const belongs =
          (incoming.senderId === buyerId  && incoming.receiverId === sellerId) ||
          (incoming.senderId === sellerId && incoming.receiverId === buyerId);

          if (!belongs) return;

        const newMsg = toUIMessage(incoming);

        setUiMessages(prev => {
          // Deduplicate — backend echoes the sender's own message back
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
     });
    } else {
      console.warn("WebSocket not connected. Messages won't be received in real-time.");
    }
   // });
    
   /* const unsubMsg = subscribeToMessages((incoming: HivemarketMessage) => {
      // Filter: only handle messages for THIS conversation
      const belongs =
        (incoming.senderId === buyerId  && incoming.receiverId === sellerId) ||
        (incoming.senderId === sellerId && incoming.receiverId === buyerId);

      if (!belongs) return;

      const newMsg = toUIMessage(incoming);

      setUiMessages(prev => {
        // Deduplicate — backend echoes the sender's own message back
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }); */

    // Subscribe to file delivery confirmation
   /* const unsubFile = subscribeToFiles((file: any) => {
      // Replace the optimistic "uploading" bubble with the real URL
      setUiMessages(prev =>
        prev.map(m =>
          m.uploading && m.text === ""
            ? { ...m, fileUrl: file.url, fileType: file.type, uploading: false }
            : m
        )
      );
    }); 

    return () => {
      unsubMsg();
      unsubFile();
    }; */
  }, []); 

  // ── Auto-scroll on first load ───────────────────────────────────────────────
  useEffect(() => {
    if (uiMessages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 150);
    }
  }, [uiMessages.length]);

  // ── Send text ───────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = draft.trim();

    console.log("line 187/ [id].tsx : => Attempting to send message:" );
    if (!text) return;

    const tempId = `temp-${Date.now()}`;

   const OptimisticMessage: UIMessage = {
      id:    tempId,  
      text:    text,
      sent:    true,
      time:    tempId
   };

   //setUiMessages((prev) => [OptimisticMessage, ...prev]);

    // Determine correct buyerId/sellerId direction
    const isBuyer  = currentUserId === buyerId;
    const reqBuyer  = isBuyer ? sellerId : buyerId ;
    const reqSeller = isBuyer ? buyerId :sellerId       ;

    console.log("line 199/ [id].tsx : => Sending message:", { text, buyerId, sellerId , currentUserId, reqBuyer, reqSeller }); 

    if(buyerId === "" || sellerId === "") {

      //console.error("BuyerId or SellerId is empty. Cannot send message.");

      alert("Please Login or Register to be able to send messages.");

      return;
    }


      //This is for sending messages
      chatSocketService.sendMessage(buyerId, sellerId,currentUserId, buyerId,  text);
    
    
    //socketSend({ buyerId: buyerId, sellerId: sellerId, message: text });
    setDraft("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [draft, currentUserId, buyerId, sellerId]);

  // ── Pick & send image ───────────────────────────────────────────────────────
  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const file  = {
      uri:  asset.uri,
      name: asset.fileName ?? `image_${Date.now()}.jpg`,
      type: asset.mimeType ?? "image/jpeg",
      size: asset.fileSize ?? 0,
    };

    // Optimistic bubble
    const tempId = `temp_${Date.now()}`;
    setUiMessages(prev => [
      ...prev,
      {
        id: tempId, text: "", sent: true,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fileUrl: asset.uri, fileType: "image", uploading: true,
      },
    ]);

    const isBuyer = currentUserId === buyerId;
   /* await socketSendFile(
      file,
      isBuyer ? currentUserId : sellerId,
      isBuyer ? sellerId       : currentUserId,
      (pct: number) => setUploadPct(pct)
    ); */
    setUploadPct(null);
  }, [currentUserId, buyerId, sellerId]);

  // ── Pick & send document ────────────────────────────────────────────────────
  const handlePickDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const file  = {
      uri:  asset.uri,
      name: asset.name,
      type: asset.mimeType ?? "application/octet-stream",
      size: asset.size ?? 0,
    };

    // Optimistic bubble
    const tempId = `temp_doc_${Date.now()}`;
    setUiMessages(prev => [
      ...prev,
      {
        id: tempId, text: "", sent: true,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fileUrl: asset.uri, fileType: "document", uploading: true,
      },
    ]);

    const isBuyer = currentUserId === buyerId;
   /*  await socketSendFile(
      file,
      isBuyer ? currentUserId : sellerId,
      isBuyer ? sellerId       : currentUserId,
      (pct: number) => setUploadPct(pct)
    ); */
    setUploadPct(null);
  }, [currentUserId, buyerId, sellerId]);

  return (

    <SafeAreaView
    style={{ flex: 1, backgroundColor: theme.screenBackground, paddingTop: 25 }}
    edges={["top", "bottom"]}
  >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >

      {/* ── Header ── */}
      <View style={[styles.chatHeader, {
        backgroundColor: theme.background,
        borderColor: isDark ? PRIMARY_DARK : "#e4f0e4",
      }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
        </Pressable>

        <Avatar name={fullName ?? ""} size={38} uri={avatar} isDark={isDark} />

        <View style={styles.chatHeaderInfo}>
          <Text style={[styles.chatHeaderName, { color: theme.text }]}>{fullName}</Text>
          <Text style={[styles.chatHeaderStatus, { color: isOnline ? PRIMARY : theme.readColor }]}>
            {isOnline ? "● Online" : "Offline"}
          </Text>
        </View>

        <Pressable style={[styles.chatIconBtn, { backgroundColor: isDark ? PRIMARY_DARK : PRIMARY_SOFT }]}>
          <Text style={{ fontSize: 16 }}>📞</Text>
        </Pressable>
      </View>

      {/* ── Loading / Error ── */}
      {messagesLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      )}

      {!!error && !messagesLoading && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Upload progress ── */}
      {uploadPct !== null && (
        <View style={styles.uploadBar}>
          <View style={[styles.uploadProgress, { width: `${uploadPct}%` }]} />
          <Text style={styles.uploadText}>{uploadPct}%</Text>
        </View>
      )}

      {/* ── Messages ── */}
      <FlatList
        ref={listRef}
        data={uiMessages}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        keyExtractor={m => m.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          !messagesLoading ? (
            <View style={styles.emptyState}>
              <Text style={{ color: theme.readColor, fontSize: 14 }}>
                No messages yet. Say hello! 👋
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          const prev     = index > 0 ? uiMessages[index - 1] : null;
          const showTime = !prev || prev.sent !== item.sent;

          return (
            <View>
              {showTime && (
                <Text style={[styles.msgTimestamp, { color: theme.readColor }]}>
                  {item.time}
                </Text>
              )}
              <View style={[
                styles.msgBubble,
                item.sent
                  ? [styles.msgSent,     { backgroundColor: PRIMARY }]
                  : [styles.msgReceived, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }],
              ]}>
                {/* File preview */}
                {item.fileUrl && (
                  <FileBubble
                    fileUrl={item.fileUrl}
                    fileType={item.fileType}
                    sent={item.sent}
                  />
                )}

                {/* Uploading spinner */}
                {item.uploading && (
                  <ActivityIndicator size="small" color={item.sent ? "#fff" : PRIMARY} />
                )}

                {/* Text */}
                {!!item.text && (
                  <Text style={[styles.msgText, { color: item.sent ? "#fff" : theme.text }]}>
                    {item.text}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ── Input bar ── */}
      <View style={[styles.inputBar, {
        backgroundColor: theme.screenBackground,
        borderColor: isDark ? PRIMARY_DARK : "#e4f0e4",
      }]}>
        {/* Attach image */}
        <Pressable onPress={handlePickImage} style={styles.attachBtn} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>🖼️</Text>
        </Pressable>

        {/* Attach document */}
        <Pressable onPress={handlePickDocument} style={styles.attachBtn} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>📎</Text>
        </Pressable>

        <View style={[styles.inputWrapper, {
          backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
          borderColor: isDark ? "#334155" : "#E2E8F0",
        }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor={theme.readColor}
            style={[styles.textInput, { color: theme.text }]}
            multiline
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
        </View>

        <Pressable
          onPress={()=> {handleSend(); console.log("Sendong message");  }}
          disabled={!draft.trim()}
          style={[styles.sendBtn, {
            backgroundColor: draft.trim() ? PRIMARY : isDark ? PRIMARY_DARK : "#d4edda",
          }]}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  chatHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn:          { marginRight: 2 },
  backArrow:        { fontSize: 28, fontWeight: "300", lineHeight: 32 },
  chatHeaderInfo:   { flex: 1 },
  chatHeaderName:   { fontSize: 15, fontWeight: "700" },
  chatHeaderStatus: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  chatIconBtn:      { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  messagesList: {
    padding: 14,
    gap: 6,
    flexGrow: 1,
  },
  msgTimestamp: { textAlign: "center", fontSize: 11, marginVertical: 8 },
  msgBubble:    { maxWidth: "78%", borderRadius: 18, padding: 11 },
  msgSent:      { alignSelf: "flex-end",   borderBottomRightRadius: 4 },
  msgReceived:  { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  msgText:      { fontSize: 14, lineHeight: 20 },

  docBubble: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 8, borderRadius: 8, marginBottom: 4,
  },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1,
  },
  attachBtn:    { paddingBottom: 4 },
  inputWrapper: {
    flex: 1, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8, maxHeight: 120,
  },
  textInput: { fontSize: 14, lineHeight: 20 },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  sendIcon: { color: "#fff", fontSize: 18, fontWeight: "800" },

  loadingContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY,
  },

  errorBanner: {
    backgroundColor: "#fee2e2", padding: 10,
    marginHorizontal: 14, borderRadius: 8,
  },
  errorText: { color: "#dc2626", fontSize: 13, textAlign: "center" },

  emptyState: { alignItems: "center", paddingTop: 60 },

  uploadBar: {
    height: 20, backgroundColor: "#e8f5e9",
    marginHorizontal: 14, borderRadius: 10, overflow: "hidden",
    flexDirection: "row", alignItems: "center",
  },
  uploadProgress: { height: "100%", backgroundColor: PRIMARY, borderRadius: 10 },
  uploadText:     { position: "absolute", right: 8, fontSize: 10, color: "#333", fontWeight: "700" },
});