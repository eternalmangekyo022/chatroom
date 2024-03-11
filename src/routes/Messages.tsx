import { useState, useEffect } from 'react'
import axios from 'axios'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import io, { Socket } from 'socket.io-client'
import { urls, url } from './urls.json'
import Chat from '../components/Chat'

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
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<IUser | null>(null)
  const [input, setInput] = useState('');
  const [connecting, setConnecting] = useState(true);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [tried, setTried] = useState(false);
  const [chats, setChats] = useState<IChat[]>([]);
  const [chat, setChat] = useState<IChat | null>(null)
  //const uuid = useRef<string>('');

  const sendMessage = () => {
    if(!input || !user || !chat) return
    // !IMPORTANT! fix reciever not being an actual reciever
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
    // eslint-disable-next-line no-constant-condition
    socket = io(urls[url], { query: { id: uid } });
    socket.on('connect', () => {
      connecting && setConnecting(false)

      //ws.send(JSON.stringify({ type: 'login' }))
    })
    
    socket.on('usermessage', ({ from, to, content, type: _type, date }: IMessage) => {
      console.log(`message recieved`)
      setMessages(p => [...p, { content, from, to, type: _type, date } as IMessage])
      setChats(chats => chats.map(chat => [from, to].includes(chat.userId) ? { ...chat, lastMessage: content }: chat))
    })

    socket.on('disconnect', () => {
      logout()
    })
  }

  useEffect(() => {
    //console.log(location.state)
    if(location.state) {
      setUser(location.state.user)
      setTried(true)
      connect(location.state.user.id)
    } else navigate('/login')

    async function loadChats() {
      const { data } = await axios.get<(IChat)[]>(`${urls[url]}/users/${location.state.user.id}/chats/`)
      console.log('chats', data.map(i => ({ ...i, messages: i.messages.map(msg => ({ ...msg, date: new Date(msg.date) })).sort((a, b) => a.date.getTime() - b.date.getTime() ) })))
      setChats(data)
    }

    loadChats()
  }, [])

  useEffect(() => {
    if(!chat) return
    setMessages(chat.messages)
  }, [chat])

    return <>
      {!user && tried ? <Navigate to='/login' replace />: tried && user && <>
      {/** when logged in */}
      <div className='absolute z-10 cursor-pointer bg-gray-500 right-16 top-10 max-md:right-5 max-md:top-5 rounded-full border-2 w-[4.4rem] h-[4.4rem] flex justify-center items-center text-4xl select-none'>
        <img src={'https://www.svgrepo.com/show/524091/logout-2.svg'} className='absolute -left-16 w-8' onClick={logout} />
        {user.name[0].toUpperCase()}
      </div>
      <div className='flex justify-start w-full h-full'>
        <div className='min-h-full w-[20vw] flex flex-col bg-gradient-to-b from-rose-300 to-rose-700'>
          {chats.map(i => <Chat onClick={id => setChat(chats.find(i => i.userId === id) || null)} lastMessage={i.lastMessage} userId={i.userId} name={i.name} />)}
        </div>
        <div className='w-[10vw]'/>
        <div className='h-screen flex flex-col w-[70vw] max-sm:top-[40vh] items-center'>
              {chat ? <> 
              <div className='w-full h-full flex flex-col items-center'>
                {messages.map(({ content }, idx) => <div key={idx} className='text-xxl'>
                  {content}
                </div>)}
              </div>
              <input disabled={connecting} placeholder='Start typing here...' value={input} onChange={e => setInput(e.target.value)} type="text" className={`w-[80%] min-w-[10rem] h-[8%] text-xl text-center bg-white opacity-70 focus:outline-none rounded-3xl ${connecting ? 'bg-slate-200': ''} `} onKeyDown={({ key }: { key: string }) => key === 'Enter' && sendMessage()}/>
              </>
              : <div className='w-full h-full flex justify-center items-center text-slate-200 opacity-80 text-4xl select-none'>No chat selected!</div>}
          </div>
      </div>
        </>
      }
    </>
}