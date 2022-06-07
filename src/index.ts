import { FirebaseClient } from './lib/firebase'
import { initDiscord } from './lib/discord'
import { fixBrokenArbMessage, fixOldAmount, initialize } from './lib/initialize'
import {
  getArbProperties,
  getArbSuccessStatus,
  getArbType,
  isArbMessage,
} from './utils/messageHelpers'
import { ArbDocument } from './types'

(async () => {
  const firebase = new FirebaseClient()
  const { channel, client } = await initDiscord()

  const { lastSavedArb, previousBrokenArbMessage: _previousBrokenArbMessage } = await initialize(firebase, channel)

  let previousArbMessageObj = lastSavedArb
  /**
   * @description Previous broken arb message -> newAmount was less than 10
   */
  let previousBrokenArbMessage: ArbDocument | null = _previousBrokenArbMessage

  client.on('messageCreate', async (message) => {
    if (!isArbMessage(message)) {
      return
    }

    const currentArbMessageObj = getArbProperties(message)
    const {
      id, description, newAmount, createdAt,
    } = currentArbMessageObj

    if (previousBrokenArbMessage) {
      const fixedPreviousArbMessage = fixBrokenArbMessage(previousBrokenArbMessage, currentArbMessageObj)
      await firebase.insertArb(fixedPreviousArbMessage)
      console.log('Saved broken message')
      previousArbMessageObj = fixedPreviousArbMessage
      previousBrokenArbMessage = null
    }

    const wasSuccessful = getArbSuccessStatus(description)
    const type = getArbType(description)

    const { oldAmount: correctOldAmount, profit: correctProfit } = fixOldAmount(currentArbMessageObj, previousArbMessageObj)
    const arbDocument: ArbDocument = {
      oldAmount: correctOldAmount,
      profit: correctProfit,
      executedAt: createdAt,
      id,
      wasSuccessful,
      type,
      newAmount,
    }

    if (newAmount < 10) {
      previousBrokenArbMessage = arbDocument
      console.log('Broken message')
      return
    }

    previousArbMessageObj = arbDocument
    await firebase.insertArb(arbDocument)
    console.log('Saved message')
  })
})()
