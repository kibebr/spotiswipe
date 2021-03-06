import { Author } from './Author'

export interface Song {
  id: string
  name: string
  author: Author
  audio: string
  imageUrl: string
  link: string
}
