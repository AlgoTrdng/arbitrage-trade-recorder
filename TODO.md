- Fetch messages that are not stored in db
  - after last message id

## Trade document

- key -> message snowflake: string

- value
  - wasSuccessful: boolean
  - executedAt: Date
  - type: 'redeem' | 'mint'
  - preArbitrageValue: number
  - postArbitrageValue: number
  - profit: number -> postValue / preValue
