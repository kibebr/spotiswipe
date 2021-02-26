import React, { useEffect, useState, useRef } from 'react'
import { Transition } from '@headlessui/react'
import { render } from 'react-dom'
import { isLeft } from 'fp-ts/lib/Either'
import './index.css'
import { getHashParams } from './utils/HashParams'
import Footer from './components/Footer'
import { SongCard } from './components/SongCard'
import { Card } from './components/Card'
import { Deck } from './components/Deck'
import { useSwipeable } from 'react-swipeable'
import { ReactComponent as StarIcon } from './assets/two-vertical-dots.svg'
import { ReactComponent as MarkIcon } from './assets/check.svg'
import { ReactComponent as CrossIcon } from './assets/cross.svg'
import { ReactComponent as PlayIcon } from './assets/play-fill.svg'
import { ReactComponent as PauseIcon } from './assets/pause-fill.svg'
import { ReactComponent as SpotifyIcon } from './assets/spotify.svg'
import { fromString, getParam } from 'fp-ts-std/URLSearchParams'
import { isSome } from 'fp-ts/Option'
import { getUser } from './api/spotify/spotifyapi'
import { pipe } from 'fp-ts/function'
import { dropRight } from 'fp-ts/lib/Array'

const {
  REACT_APP_CLIENT_ID,
  REACT_APP_REDIRECT_URI
} = process.env

export interface Song {
  name: string
  author: string
  audio: HTMLAudioElement
  imageUrl: string
}

export type Playlist = {
  id: string
  name: string
  songs: Song[]
}

export type User = {
  id: string
  name: string
  playlists: Playlist[]
}

export type Preference
  = 'ByLikedSongs'
  | 'ByPlaylist'

type SwipeDirection
  = 'LEFT'
  | 'RIGHT'

export default function Home (): JSX.Element {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [savedSongs, setSavedSongs] = useState<Song[]>([])
  const [songPlaying, setSongPlaying] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const swipeBtns = useRef<HTMLDivElement>(null)

  const scopes = 'user-read-private, user-library-read, playlist-read-private, playlist-read-collaborative'

  const handlers = useSwipeable({
    onSwiped: (swipeData) => {
      const target = swipeData.event.target as HTMLElement
      const { absX, deltaX, deltaY, vxvy } = swipeData
      const moveOutWidth = document.body.clientWidth
      const shouldKeep = absX < 80 || Math.abs(vxvy[0]) < 0.5

      if (shouldKeep) {
        target.style.transform = ''
      } else {
        const endX = Math.max(Math.abs(vxvy[0]) * moveOutWidth, moveOutWidth)
        const toX = deltaX > 0 ? endX : -endX
        const endY = Math.abs(vxvy[1]) * moveOutWidth
        const toY = deltaY > 0 ? endY : -endY

        const xMulti = deltaX * 0.03
        const yMulti = deltaY / 80
        const rotate = xMulti * yMulti

        target.style.transform = `translate(${toX}px, ${toY - deltaY}px) rotate(${rotate}deg)`
        swipe('RIGHT')
      }
    },
    onSwiping: (swipeData) => {
      const target = swipeData.event.target as HTMLElement

      if (!target.classList.contains('card') || Number(target.id) !== songs.length - 1) {
        return
      }

      target.classList.add('no-transition')

      const { deltaX, deltaY } = swipeData
      const xMulti = deltaX * 0.03
      const yMulti = deltaY / 80
      const rotate = xMulti * yMulti

      target.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  })

  const refresh = (user: User): void => {
    getSongs(user)()
      .then(result => {
        if (!isLeft(result)) {
          setSongs(s => result.right.concat(s))
        }
      })
      .catch(handleError)
  }

  useEffect((): void => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight / 100}px`)

    setSongs([
      {
        name: 'a song',
        author: 'some author',
        audio: new Audio('whatever'),
        imageUrl: 'whatever'
      },
      {
        name: 'a song',
        author: 'some author',
        audio: new Audio('whatever'),
        imageUrl: 'whatever'
      },
      {
        name: 'a song',
        author: 'some author',
        audio: new Audio('whatever'),
        imageUrl: 'whatever'
      }
    ])

    const maybeToken = pipe(
      window.location.hash.split('#')[1],
      fromString,
      getParam('access_token')
    )

    if (isSome(maybeToken)) {
      getUser(maybeToken.value)()
        .then(result => {
          if (isLeft(result)) {
            console.error(result.left)
          } else {
            console.log(result.right)
          }
        })
    }
  }, [])

  useEffect((): void => {
    if (songs.length === 0 && user !== null) {
      refresh(user)
    }
  }, [songs, user])

  useEffect((): void => {
    if (songPlaying && songs.length >= 1) {
      songs[songs.length - 1].audio.play()
        .catch(err => {
          setSongPlaying(false)
          console.error(err)
        })
    }
  }, [songs])

  const swipe = (dir: SwipeDirection): void => {
    if (dir === 'RIGHT' && songs.length !== 0) {
      setSavedSongs(s => s.concat(songs[songs.length - 1]))
    }

    songs[songs.length - 1].audio.pause()
    setSongs(dropRight(1))
  }

  const handleLogin = (): void => {
    let url = 'https://accounts.spotify.com/authorize'

    url += '?response_type=token'
    url += '&client_id=' + encodeURIComponent(REACT_APP_CLIENT_ID as string)
    url += '&scope=' + encodeURIComponent(scopes)
    url += '&redirect_uri=' + encodeURIComponent(REACT_APP_REDIRECT_URI as string)

    window.location.href = url
  }

  const handleError = (err: Error): void => {
    console.error(err)
  }

  const toggleAudio = (song: Song): void => {
    if (song.audio.paused) {
      song.audio.play()
        .catch(handleError)

      setSongPlaying(true)
    } else {
      song.audio.pause()
      setSongPlaying(false)
    }
  }

  return (
    <div className="font-bold text-green-400">
      <section className="z-50 flex flex-col px-4 m-0 m-auto min-vh py-7 md:py-8 max-w-screen-sm">
        <div className="flex flex-row items-center justify-between align-baseline">
          <a href="http://192.168.0.16:3000">
            <h1 className="mb-2 text-3xl font-bold text-purple-strong md:text-3xl rounded-2xl hover:text-white transition-colors">
              spotiswype
            </h1>
          </a>
          {user !== null && (
            <button
              onClick={(): void => setMenuOpen((s) => !s)}
              className="relative hover:text-white text-purple-strong"
            >
              <StarIcon
                className="absolute fill-current transition-colors inset-center"
                width={24}
                height={24}
              />
            </button>
          )}
        </div>
        <div className="flex flex-col justify-between align-baseline">
          {user !== null && (
            <p className="text-xl font-bold text-gray-400 md:text-1xl">
              Find songs you'll enjoy by swiping.
            </p>
          )}
        </div>
        <div>
          {user !== null && (
            <button
              onClick={handleLogin}
              className="flex flex-row items-center p-2 mt-5 bg-green-400 rounded"
            >
              <SpotifyIcon className="mr-2" width="16px" height="16px" />
              <span className="font-bold text-black">
                Log-in with Spotify
              </span>
            </button>
          )}
      </div>

      <div className="flex justify-center h-full outline-white">
        {songs.length !== 0 && (
          <div>
            <div className='flex justify-center' {...handlers}>
              <Deck songs={songs} />
            </div>
            <div
              ref={swipeBtns}
              className="absolute bottom-0 z-50 flex flex-row items-center justify-between w-32 px-5 py-3 bg-white rounded-full inset-center-x h-14"
            >
              <button
                onClick={(): void => swipe('LEFT')}
                className="p-1 text-red-500 rounded transition-all hover:bg-red-500 hover:text-white"
              >
                <CrossIcon className="fill-current" width='16px' height='16px' />
              </button>
              <button onClick={(): void => toggleAudio(songs[songs.length - 1])} className='rounded transition-all text-purple-strong hover:bg-purple-strong hover:text-white'>
                {songPlaying ? <PauseIcon width='24px' height='24px' /> : <PlayIcon width='24px' height='24px' />}
              </button>
              <button
                onClick={(): void => swipe('RIGHT')}
                className="p-1 text-green-500 rounded transition-all hover:bg-green-500 hover:text-white"
              >
                <MarkIcon className="fill-current" width='16px' height='16px' />
              </button>
            </div>
          </div>
      )}

  {songs.length === 0 && user !== null && <p>Loading songs...</p>}
</div>
      </section>
    </div>
  )
}

render(<Home />, document.getElementById('root'))

// TODO: let user decide if swiped-right songs will be added to a certain playlist automatically
