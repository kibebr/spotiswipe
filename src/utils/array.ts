export const randomElements = (n: number) => <T>(arr: T[]): T[] =>
  arr
    .sort(() => Math.random() - Math.random())
    .slice(0, n)
  
export const unsafeHead = <T>(arr: T[]): T => arr[0]

