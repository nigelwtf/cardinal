import { customAlphabet } from "nanoid"

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
const generate = customAlphabet(alphabet, 10)

export const newId = (prefix: string) => `${prefix}_${generate()}`
