import dotenv from 'dotenv'
// import path from 'path'
// import fs from 'fs'

dotenv.config()

type EnvConfig = {
  DISCORD_TOKEN: string
  DISCORD_CHANNEL_ID: string
  BOT_ID: string
  FIREBASE_API_KEY: string
  FIREBASE_AUTH_DOMAIN: string
  FIREBASE_PROJECT_ID: string
  FIREBASE_STORAGE_BUCKET: string
  FIREBASE_SENDER_ID: string
  FIREBASE_APP_ID: string
  FIREBASE_MEASUREMENT_ID: string
  COLLECTION_NAME: string
}

const loadEnvConfig = () => {
  const {
    DISCORD_TOKEN,
    DISCORD_CHANNEL_ID,
    BOT_ID,
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_SENDER_ID,
    FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID,
    COLLECTION_NAME,
  } = process.env as EnvConfig
  const envConfig: EnvConfig = {
    DISCORD_TOKEN,
    DISCORD_CHANNEL_ID,
    BOT_ID,
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_SENDER_ID,
    FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID,
    COLLECTION_NAME,
  }

  Object.entries(envConfig).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      throw new Error(`Missing ${key} ENV variable`)
    }
  })

  return envConfig
}

export const config: EnvConfig = {
  ...loadEnvConfig(),
}
