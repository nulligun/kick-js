import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { KickChannelInfo } from "../types/channels";
import type { VideoInfo } from "../types/video";
import { config, process } from "dotenv";
config();

export const getChannelData = async (
  channel: string,
): Promise<KickChannelInfo | null> => {
  let browser = null;
  let page = null;
  let count = 0;
  while (count < 5) {
    try {
      const puppeteerExtra = puppeteer.use(StealthPlugin());
      browser = await puppeteerExtra.launch({
        args: ['--proxy-server=api.zyte.com:8011', '--ignore-certificate-errors'],
        headless: true
      });
      page = await browser.newPage();
      // get username from environment variable
      await page.authenticate({
        username: process.env.ZYTE_USERNAME,
        password: '',
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
    // sleep for 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return null;
};

export const getVideoData = async (
  video_id: string,
): Promise<VideoInfo | null> => {
  const puppeteerExtra = puppeteer.use(StealthPlugin());
  const browser = await puppeteerExtra.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`https://kick.com/api/v1/video/${video_id}`);
  await page.waitForSelector("body");

  try {
    const jsonContent: VideoInfo = await page.evaluate(() => {
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
