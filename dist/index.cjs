"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  createClient: () => createClient
});
module.exports = __toCommonJS(src_exports);

// src/client/client.ts
var import_ws2 = require("ws");
var import_events = __toESM(require("events"), 1);

// src/core/kickApi.ts
var import_puppeteer_extra = __toESM(require("puppeteer-extra"), 1);
var import_puppeteer_extra_plugin_stealth = __toESM(require("puppeteer-extra-plugin-stealth"), 1);
var import_dotenv = require("dotenv");
(0, import_dotenv.config)();
var getChannelData = async (channel) => {
  let browser = null;
  let page = null;
  let count = 0;
  while (count < 5) {
    try {
      const puppeteerExtra = import_puppeteer_extra.default.use((0, import_puppeteer_extra_plugin_stealth.default)());
      browser = await puppeteerExtra.launch({
        args: ["--proxy-server=api.zyte.com:8011", "--ignore-certificate-errors"],
        headless: true
      });
      page = await browser.newPage();
      await page.authenticate({
        username: import_dotenv.process.env.ZYTE_USERNAME,
        password: ""
      });
      await page.goto(`https://kick.com/api/v2/channels/${channel}`);
      await page.waitForSelector("body");
    } catch (error) {
      console.error("Error getting channel data:", error);
    }
    try {
      const jsonContent = await page.evaluate(() => {
        const bodyElement = document.querySelector("body");
        if (!bodyElement || !bodyElement.textContent) {
          throw new Error("Unable to fetch channel data");
        }
        console.log(bodyElement.textContent);
        return bodyElement.textContent;
      });
      console.log(jsonContent);
      await browser.close();
      return JSON.parse(jsonContent);
    } catch (error) {
      await browser.close();
      console.error("Error getting channel data:", error);
    }
    count++;
    await new Promise((resolve) => setTimeout(resolve, 2e3));
  }
  return null;
};
var getVideoData = async (video_id) => {
  const puppeteerExtra = import_puppeteer_extra.default.use((0, import_puppeteer_extra_plugin_stealth.default)());
  const browser = await puppeteerExtra.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://kick.com/api/v1/video/${video_id}`);
  await page.waitForSelector("body");
  try {
    const jsonContent = await page.evaluate(() => {
      const bodyElement = document.querySelector("body");
      if (!bodyElement || !bodyElement.textContent) {
        throw new Error("Unable to fetch video data");
      }
      console.log(bodyElement.textContent);
      return JSON.parse(bodyElement.textContent);
    });
    await browser.close();
    return jsonContent;
  } catch (error) {
    await browser.close();
    console.error("Error getting video data:", error);
    return null;
  }
};

// src/core/websocket.ts
var import_ws = __toESM(require("ws"), 1);
var import_url = require("url");
var BASE_URL = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679";
var createWebSocket = (chatroomId) => {
  const urlParams = new import_url.URLSearchParams({
    protocol: "7",
    client: "js",
    version: "7.4.0",
    flash: "false"
  });
  const url = `${BASE_URL}?${urlParams.toString()}`;
  const socket = new import_ws.default(url);
  socket.on("open", () => {
    const connect = JSON.stringify({
      event: "pusher:subscribe",
      data: { auth: "", channel: `chatrooms.${chatroomId}.v2` }
    });
    socket.send(connect);
  });
  return socket;
};

// src/utils/messageHandling.ts
var parseMessage = (message) => {
  try {
    const messageEventJSON = JSON.parse(message);
    if (messageEventJSON.event === "App\\Events\\ChatMessageEvent") {
      const data = JSON.parse(messageEventJSON.data);
      return { type: "ChatMessage", data };
    } else {
      return { type: messageEventJSON.event.split("\\").pop().replace("Event", ""), data: messageEventJSON.data };
    }
    return null;
  } catch (error) {
    console.error("Error parsing message:", error);
    return null;
  }
};

// src/client/client.ts
var import_axios = __toESM(require("axios"), 1);
var createClient = (channelName, options = {}) => {
  const emitter = new import_events.default();
  let socket = null;
  let channelInfo = null;
  let videoInfo = null;
  let token = null;
  let cookies = null;
  const defaultOptions = {
    plainEmote: true,
    logger: false
  };
  const mergedOptions = { ...defaultOptions, ...options };
  const initialize = async () => {
    try {
      channelInfo = await getChannelData(channelName);
      if (!channelInfo) {
        throw new Error("Unable to fetch channel data");
      }
      socket = createWebSocket(channelInfo.chatroom.id);
      socket.on("open", () => {
        if (mergedOptions.logger) {
          console.log(`Connected to channel: ${channelName}`);
        }
        emitter.emit("ready", getUser());
      });
      socket.on("message", (data) => {
        const parsedMessage = parseMessage(data.toString());
        if (parsedMessage) {
          if (mergedOptions.plainEmote && parsedMessage.type === "ChatMessage") {
            const parsedMessagePlain = parsedMessage.data;
            parsedMessagePlain.content = parsedMessagePlain.content.replace(
              /\[emote:(\d+):(\w+)\]/g,
              (_, __, emoteName) => emoteName
            );
          }
          emitter.emit(parsedMessage.type, parsedMessage.data);
        }
      });
      socket.on("close", () => {
        if (mergedOptions.logger) {
          console.log(`Disconnected from channel: ${channelName}`);
        }
        emitter.emit("disconnect");
      });
    } catch (error) {
      console.error("Error during initialization:", error);
      throw error;
    }
  };
  const getUser = () => channelInfo ? {
    id: channelInfo.id,
    username: channelInfo.slug,
    tag: channelInfo.user.username
  } : null;
  const on = (event, listener) => {
    emitter.on(event, listener);
  };
  const vod = async (video_id) => {
    videoInfo = await getVideoData(video_id);
    if (!videoInfo) {
      throw new Error("Unable to fetch video data");
    }
    return {
      id: videoInfo.id,
      title: videoInfo.livestream.session_title,
      thumbnail: videoInfo.livestream.thumbnail,
      duration: videoInfo.livestream.duration,
      live_stream_id: videoInfo.live_stream_id,
      start_time: videoInfo.livestream.start_time,
      created_at: videoInfo.created_at,
      updated_at: videoInfo.updated_at,
      uuid: videoInfo.uuid,
      views: videoInfo.views,
      stream: videoInfo.source,
      language: videoInfo.livestream.language,
      livestream: videoInfo.livestream,
      channel: videoInfo.livestream.channel
    };
  };
  const login = async (credentials) => {
    token = credentials.token;
    cookies = credentials.cookies;
    console.log("Logged in successfully as : ", token);
  };
  const sendMessage = async (messageContent) => {
    if (!token || !cookies || !channelInfo) {
      throw new Error("Not logged in or channel info not available");
    }
    try {
      const response = await import_axios.default.post(
        `https://kick.com/api/v2/messages/send/${channelInfo.chatroom.id}`,
        {
          content: messageContent,
          type: "message"
        },
        {
          headers: {
            accept: "application/json, text/plain, */*",
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
            "x-xsrf-token": token,
            cookie: cookies,
            Referer: `https://kick.com/${channelInfo.slug}`
          }
        }
      );
      if (response.status === 200) {
        console.log(`Message sent successfully: ${messageContent}`);
      } else {
        console.error(`Failed to send message. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  const permanentBan = async (bannedUser) => {
    if (!token || !cookies || !channelInfo) {
      throw new Error("Not logged in or channel info not available");
    }
    if (!bannedUser) {
      throw new Error("Specify a user to ban");
    }
    try {
      const response = await import_axios.default.post(
        `https://kick.com/api/v2/channels/${channelInfo.id}/bans`,
        { banned_username: bannedUser, permanent: true },
        {
          headers: {
            accept: "application/json, text/plain, */*",
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
            "x-xsrf-token": token,
            cookie: cookies,
            Referer: `https://kick.com/${channelInfo.slug}`
          }
        }
      );
      if (response.status === 200) {
        console.log(`Banned user ${bannedUser} sent successfully`);
      } else {
        console.error(`Failed to Ban user. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  const slowMode = async (mode, durationInSeconds) => {
    if (!token || !cookies || !channelInfo) {
      throw new Error("Not logged in or channel info not available");
    }
    if (mode !== "on" && mode !== "off") {
      throw new Error("Invalid mode, must be 'on' or 'off'");
    }
    if (mode === "on" && durationInSeconds && durationInSeconds < 1) {
      throw new Error(
        "Invalid duration, must be greater than 0 if mode is 'on'"
      );
    }
    try {
      if (mode === "off") {
        const response = await await import_axios.default.put(
          `https://kick.com/api/v2/channels/${channelInfo.slug}/chatroom`,
          { slow_mode: false },
          {
            headers: {
              accept: "application/json, text/plain, */*",
              authorization: `Bearer ${token}`,
              "content-type": "application/json",
              "x-xsrf-token": token,
              cookie: cookies,
              Referer: `https://kick.com/${channelInfo.slug}`
            }
          }
        );
        if (response.status === 200) {
          console.log(`Turned slow mode off successfully`);
        } else {
          console.error(`Failed to Ban user. Status: ${response.status}`);
        }
      } else {
        const response = await await import_axios.default.put(
          `https://kick.com/api/v2/channels/${channelInfo.slug}/chatroom`,
          { slow_mode: true, message_interval: durationInSeconds },
          {
            headers: {
              accept: "application/json, text/plain, */*",
              authorization: `Bearer ${token}`,
              "content-type": "application/json",
              "x-xsrf-token": token,
              cookie: cookies,
              Referer: `https://kick.com/${channelInfo.slug}`
            }
          }
        );
        if (response.status === 200) {
          console.log(`Turned slow mode on for ${durationInSeconds} seconds`);
        } else {
          console.error(`Failed to Ban user. Status: ${response.status}`);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  void initialize();
  return {
    on,
    vod,
    get user() {
      return getUser();
    },
    login,
    sendMessage,
    permanentBan,
    slowMode
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createClient
});
