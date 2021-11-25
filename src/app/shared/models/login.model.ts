export interface Login {
  credentials: {
    username?: string
    password?: string
  },
  requiredServices: string[]
}
