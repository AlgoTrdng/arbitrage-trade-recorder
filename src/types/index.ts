export type ArbTradeStats = {
  newAmount: number
  oldAmount: number
  profit: number
}

export type ArbDiscordMessageObj = {
  id: string
  createdAt: Date
  description: string
} & ArbTradeStats

export type ArbDocument = ArbTradeStats & {
  id: string
  wasSuccessful: boolean
  type: 'mint' | 'redeem'
  executedAt: Date
}
