import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import io, { Socket } from 'socket.io-client'
import { urls, url } from './urls.json'
import Chat from '../components/Chat'
import { useQuery, useQueryClient, useMutation } from 'react-query'

interface IChat {
  userId: number
  name: string
  lastMessage: string | null
  messages: IMessage[]
}

interface IMessage {
  id: number
  type: 'message' | 'image'
  from: number
  to: number
  date: Date
  content: string
  replyTo?: number
}

interface IUser {
  id: number
  name: string
  username: string
  password: string
}

let socket: Socket;

export default function App() {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<IUser | null>(null)
  const [chat, setChat] = useState<Omit<IChat, 'messages'> | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([])
  const [input, setInput] = useState('');
  const [tried, setTried] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate()
  const location = useLocation()
  const shouldLogout = useRef(true);

  const { data: chats } = useQuery<IChat[]>({
    queryKey: ['chats'],
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => (await axios.get<IChat[]>(`${urls[url]}/users/${(user as IUser).id}/chats/`, { headers: { "Content-Type": 'application/json' } })).data.map(i => ({ ...i, messages: i.messages.map(msg => ({ ...msg, date: new Date(msg.date) })) })),
    onSuccess: (e) => {
      console.log(e[0].messages)
    },
  })

  const { mutate: mutateChats } = useMutation(async(newChats: IChat[]) => {
    queryClient.setQueryData<IChat[]>('chats', newChats)
  }, {
    onMutate: prev => {
      if(!chat) return
      setMessages(() => prev!.filter(i => i.userId === chat.userId)[0].messages.sort((a, b) => a.date.getTime() - b.date.getTime()))
    }
  })
/**
 * 
 * @ , {
    queryKey: ['chats'],
    enabled: false,
    queryFn: async() => ((await axios.get<(IChat)[]>(`${urls[url]}/users/${location.state.user.id}/chats/`)).data
    )
  }
 */

  const sendMessage = () => {
    if(!input || !user || !chat) return
    socket.emit('usermessage', { content: input, from: user?.id, to: chat.userId })
    setInput('');
  }

  const logout = async() => {
    console.log('logout')
    setUser(null)
    if(location!.state) {
      location.state = {};
    }
    navigate('/login')
  }

  const connect = (uid: number) => {
    //console.log('connecting', uid)
    // eslint-disable-next-line no-constant-condition
    socket = io(urls[url], { auth: { userId: uid }});
    socket.on('connect', () => {
      connecting && setConnecting(false)
      //ws.send(JSON.stringify({ type: 'login' }))
    })
    
    socket.on('usermessage', ({ from, to, content, type: _type, date, id }: IMessage) => {
      const chats = queryClient.getQueryData<IChat[]>('chats');
      if(!chats) return;
      const newMsg: IMessage = { from, to, content, type: _type, date: new Date(date), id };
      //console.log(`message recieved ${socket.id}`)
      //////////////////////////////////
      mutateChats(chats.map(({ userId, messages }, idx) => [from, to].includes(userId) ? { ...chats[idx], lastMessage: content, messages: [...messages, newMsg] }: chats[idx]))
    })

    socket.on('disconnect', () => {
      if(shouldLogout.current) logout()
    })
  }

  useEffect(() => {
    if(!(location.state.user)) navigate('/login')
    setUser(location.state.user)
    connect(location.state.user.id)
    setTried(true)

    return () => {
      shouldLogout.current = false;
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    if(!chat || !inputRef.current) return
    //console.log('chat changed')
    setMessages(chats!.filter(i => i.userId === chat.userId)[0].messages)
    inputRef.current.focus({ preventScroll: false })
  }, [chat])

    return <>
      {!user && tried ? <Navigate to='/login' replace />: !!user && tried && <>
      {/** when logged in */}
      <div className='absolute z-10 cursor-pointer bg-gray-500 right-16 top-10 max-md:right-5 max-md:top-5 rounded-full border-2 w-[4.4rem] h-[4.4rem] flex justify-center items-center text-4xl select-none'>
        <img src={'https://www.svgrepo.com/show/524091/logout-2.svg'} className='absolute -left-16 w-8' onClick={logout} />
        {user.name[0].toUpperCase()}
      </div>
      <div className='flex justify-start w-full h-full'>
        <div className='h-full w-[20vw] flex flex-col bg-gradient-to-b from-rose-400 to-rose-700'>
          {(chats || []).map(i => <Chat key={i.userId} selected={chat?.userId === i.userId} onClick={id => {
            setChat((chats || []).find(i => i.userId === id) || null)
          }} lastMessage={i.lastMessage} userId={i.userId} name={i.name} />)}
        </div>
        <div className='w-[10vw]'/>
        <div className='h-screen flex flex-col w-[70vw] max-sm:top-[40vh] items-center'>
              {chat ? <> 
              <div className='w-full h-full flex flex-col items-center'>
                {messages.map(({ content }, idx) => <div key={idx} className='text-xxl'>
                  {content}
                </div>)}
              </div>
              <input disabled={connecting} placeholder='Start typing here...' ref={inputRef} value={input} onChange={e => setInput(e.target.value)} type="text" className={`w-[80%] min-w-[10rem] h-[8%] text-xl text-center bg-white opacity-70 focus:outline-none rounded-3xl ${connecting ? 'bg-slate-200': ''} `} onKeyDown={({ key }: { key: string }) => key === 'Enter' && sendMessage()}/>
              </>
              : <div className='w-full h-full flex justify-center items-center text-slate-200 opacity-80 text-4xl select-none'>No chat selected!</div>}
          </div>
      </div>
        </>
      }
    </>
}