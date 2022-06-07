import { EmbedField, Message } from 'discord.js'

import { config } from '../app.config'
import { ArbDiscordMessageObj } from '../types'
import { getArbTradeStats } from './embedHelpers'

export const isArbMessage = (message: Message) => {
  const { author, embeds } = message

  if (author.id !== config.BOT_ID || !embeds.length) {
    return false
  }

  return true
}

export const getArbProperties = (arbDiscordMessage: Message): ArbDiscordMessageObj => {
  const { embeds, createdAt, id } = arbDiscordMessage

  const [arbStatsEmbed] = embeds
  const { description, fields } = arbStatsEmbed as { description: string; fields: EmbedField[] }
  const arbStats = getArbTradeStats(fields)

  return {
    ...arbStats,
    description,
    createdAt,
    id,
  }
}

export const getArbType = (description: string) => (
  description.match(/REDEEM/g) ? 'redeem' : 'mint'
)

export const getArbSuccessStatus = (description: string) => (
  !description.match(/Unsuccessfully/g)
)
