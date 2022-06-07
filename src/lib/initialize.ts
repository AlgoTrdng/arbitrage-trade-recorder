import { Message, TextChannel } from 'discord.js'

import { FirebaseClient } from './firebase'
import {
  fetchMessages,
  FetchMessagesConfig,
  filterArbMessages,
  transformCollectionToArray,
} from './discord'
import { getArbProperties, getArbSuccessStatus, getArbType } from '../utils/messageHelpers'
import { ArbDiscordMessageObj, ArbDocument } from '../types'
import { getProfit } from '../utils/getProfit'

// Assume previous one is always going to be correct
export const fixOldAmount = (currentArb: ArbDiscordMessageObj, prevArb: ArbDocument | null) => {
  if (currentArb.oldAmount > 10 || !prevArb) {
    return { oldAmount: currentArb.oldAmount, profit: currentArb.profit }
  }

  const correctOldAmount = prevArb.newAmount
  return {
    oldAmount: correctOldAmount,
    profit: getProfit(correctOldAmount, currentArb.newAmount),
  }
}

/**
 * @description Replaces previous message `newAmount` with current message `oldAmount` and updates profit
 */
export const fixBrokenArbMessage = (brokenArbMessage: ArbDocument, currentArbMessage: ArbDiscordMessageObj): ArbDocument => {
  const { oldAmount } = brokenArbMessage
  const profit = getProfit(oldAmount, currentArbMessage.oldAmount)
  return {
    ...brokenArbMessage,
    newAmount: currentArbMessage.oldAmount,
    profit,
  }
}

type Direction = 'after' | 'before'

const getDecisiveMessage = (direction: Direction, allMessages: Message[]) => {
  const idx = direction === 'after' ? allMessages.length - 1 : 0
  return allMessages[idx]
}

const getFetchMessagesConfig = (direction: Direction, decisiveId?: string): FetchMessagesConfig => (
  direction === 'after'
    ? { limit: 100, after: decisiveId }
    : { limit: 100, before: decisiveId }
)

const concatMessages = (direction: Direction, allMessages: Message[], remainingMessages: Message[]) => (
  direction === 'after'
    ? [...allMessages, ...remainingMessages]
    : [...remainingMessages, ...allMessages]
)

const fetchAllUnsyncedMessages = async (channel: TextChannel, lastSavedArbId?: string) => {
  const direction: Direction = lastSavedArbId ? 'after' : 'before'

  const messagesCollection = await fetchMessages(channel, getFetchMessagesConfig(direction, lastSavedArbId))
  messagesCollection.reverse()
  let allMessages = filterArbMessages(transformCollectionToArray(messagesCollection))

  if (allMessages.length < 100) {
    return allMessages
  }

  while (true) {
    const { id } = getDecisiveMessage(direction, allMessages)
    const fetchMessagesConfig = getFetchMessagesConfig(direction, id)
    const remainingMessagesCollection = await fetchMessages(channel, fetchMessagesConfig)

    if (!remainingMessagesCollection.size) {
      break
    }

    remainingMessagesCollection.reverse()
    const remainingMessagesArr = filterArbMessages(transformCollectionToArray(remainingMessagesCollection))

    allMessages = concatMessages(
      direction,
      allMessages,
      remainingMessagesArr,
    )
  }

  return allMessages
}

export const initialize = async (firebase: FirebaseClient, channel: TextChannel) => {
  /**
   * @description Last document saved in db, if syncing messages happens, will be reassigned to be new last saved
   */
  let lastSavedArb = await firebase.getLastArb()
  const unsyncedMessages = await fetchAllUnsyncedMessages(channel, lastSavedArb?.id)

  if (!unsyncedMessages.length) {
    return {
      lastSavedArb,
      previousBrokenArbMessage: null,
    }
  }

  let batchWrite = firebase.initBatchWrite()

  /**
   * @description If last message is broken save it here
   */
  let previousBrokenArbMessage: ArbDocument | null = null
  for (let i = 0; i < unsyncedMessages.length; i += 1) {
    if (i % 499 === 0) {
      await batchWrite.save()
      batchWrite = firebase.initBatchWrite()
    }

    const currentArbMessage = getArbProperties(unsyncedMessages[i])
    const {
      id, description, newAmount, createdAt,
    } = currentArbMessage

    const wasSuccessful = getArbSuccessStatus(description)
    const type = getArbType(description)

    const { oldAmount: correctOldAmount, profit } = fixOldAmount(currentArbMessage, lastSavedArb)
    let currentArbDocument: ArbDocument = {
      executedAt: createdAt,
      oldAmount: correctOldAmount,
      profit,
      newAmount,
      id,
      wasSuccessful,
      type,
    }

    if (newAmount < 10) {
      const nextArb = unsyncedMessages[i + 1] ? getArbProperties(unsyncedMessages[i + 1]) : null

      if (!nextArb) {
        previousBrokenArbMessage = currentArbDocument
        // can happen only on last message
        break
      }

      currentArbDocument = fixBrokenArbMessage(currentArbDocument, nextArb)
    }

    lastSavedArb = currentArbDocument
    batchWrite.add(currentArbDocument)
  }

  await batchWrite.save()
  return {
    lastSavedArb,
    previousBrokenArbMessage,
  }
}
