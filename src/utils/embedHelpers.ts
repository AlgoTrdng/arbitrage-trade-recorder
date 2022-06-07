import { EmbedField } from 'discord.js'

import { ArbTradeStats } from '../types'

const getField = (fields: EmbedField[], name: 'Old amount' | 'New amount' | 'Profit') => (
  fields.find(({ name: _name }) => _name === name)
)

const getAmountNumber = (amountUi: string) => +amountUi.split(' ')[1]

export const getArbTradeStats = (fields: EmbedField[]) => {
  const fieldsObj: Record<string, string | number> = {}

  const { value: oldAmountUi } = getField(fields, 'Old amount')!
  fieldsObj.oldAmount = getAmountNumber(oldAmountUi)

  const { value: newAmountUi } = getField(fields, 'New amount')!
  fieldsObj.newAmount = getAmountNumber(newAmountUi)

  const { value: profitUi } = getField(fields, 'Profit')!
  fieldsObj.profit = +(+profitUi.slice(0, -1) / 100).toFixed(4)

  return fieldsObj as ArbTradeStats
}
