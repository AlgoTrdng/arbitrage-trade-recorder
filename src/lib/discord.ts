import {
  Client,
  Intents,
  Message,
  TextChannel,
} from 'discord.js'

import { config } from '../app.config'
import { isArbMessage } from '../utils/messageHelpers'

export const initDiscord = async () => {
  const client = new Client({ intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGES] })
  await client.login(config.DISCORD_TOKEN)

  const channel = await client.channels.fetch(config.DISCORD_CHANNEL_ID) as TextChannel

  return {
    channel,
    client,
  }
}

export type FetchMessagesConfig = {
  limit?: number
  before?: string
  after?: string
}

export const fetchMessages = async (channel: TextChannel, fetchMessagesConfig?: FetchMessagesConfig) => (
  channel.messages.fetch(fetchMessagesConfig)
)

type UnPromisify<T> = T extends Promise<infer U> ? U : T

export const transformCollectionToArray = (collection: UnPromisify<ReturnType<typeof fetchMessages>>) => {
  const collectionArr: Message[] = []
  collection.forEach((item) => {
    collectionArr.push(item)
  })

  return collectionArr
}

export const filterArbMessages = (messages: Message[]) => (
  messages.filter((message) => isArbMessage(message))
)
