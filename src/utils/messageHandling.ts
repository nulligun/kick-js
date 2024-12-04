import type {
  MessageEvent,
  ChatMessage,
  Subscription,
  RaidEvent,
} from "../types/events";

export const parseMessage = (message: string) => {
  try {
    const messageEventJSON = JSON.parse(message) as MessageEvent;

    if (messageEventJSON.event === "App\\Events\\ChatMessageEvent") {
      const data = JSON.parse(messageEventJSON.data) as ChatMessage;
      return { type: "ChatMessage", data };
    } else {
      return { type: messageEventJSON.event.split("\\").pop().replace("Event", ""), data: messageEventJSON.data };
    }
    // Add more event types as needed

    return null;
  } catch (error) {
    console.error("Error parsing message:", error);
    return null;
  }
};
