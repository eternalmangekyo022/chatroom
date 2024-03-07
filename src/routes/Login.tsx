import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { urls, url } from './urls.json'
import '../../../global.d.ts'


export default function Login() {
	const [passVisible, setPassVisible] = useState(false)
	const button = useRef<HTMLButtonElement>(null)
	const username = useRef<HTMLInputElement>(null)
	const password = useRef<HTMLInputElement>(null)
	const navigate = useNavigate()

	const login = async() => {
		try {
			if(!username.current || !password.current) return;
			const { data: { user } } = await axios.post<{ id: string, status: string, user: IUser }>(`${urls[url]}/login`, JSON.stringify({ username: username.current.value, password: password.current.value }), { headers: { 'Content-Type': 'application/json' } });
			navigate('/messages', { state: { user } })
		} catch(e) {
			console.log(e)
			if(e?.response?.status === 401 && button.current) {
				button.current.classList.add('shake')
			}
		}
	}

	return <div className='center flex flex-col justify-evenly items-center w-[25rem] h-[30rem]'>
	<span className='relative text-4xl h-[10%] flex justify-center items-center'>Log in</span>
	<div className='w-[80%] h-16 flex flex-col justify-evenly'>
		<label htmlFor="username" className='relative left-1'>Username</label>
		<input defaultValue='hxrd' ref={username} type="text" id='username' className='w-full h-16 border-2 rounded-xl outline-none transition-[.2s] hover:bg-rose-200 focus:bg-slate-200 text-center border-orange-400' />
	</div>
	<div className='w-[80%] h-16 flex flex-col relative'>
		<label htmlFor="password" className='relative left-1'>Password</label>
		<div className='relative w-full h-16'>
			<input defaultValue='admin' ref={password} type={passVisible ? 'text': 'password'} id='password' className='center w-full h-full border-2 rounded-xl outline-none transition-[.2s] hover:bg-rose-200 focus:bg-slate-200 text-center border-orange-500' />
			<img onMouseDown={() => setPassVisible(true)} onMouseUp={() => setPassVisible(false)} src={passVisible ? 'https://www.svgrepo.com/show/532465/eye-slash.svg': 'https://www.svgrepo.com/show/532493/eye.svg'} className='absolute top-1/2 -translate-y-1/2 right-[.4rem] w-7 h-7 cursor-pointer rounded-full opacity-[0.4]' />
		</div>
	</div>
	<button onClick={login} ref={button} className='rounded-xl w-32 h-10 border-2 border-rose-200 transition-[.2s] bg-rose-200 hover:border-rose-400 hover:animate-pulse tracking-wider'>Submit</button>
  </div>
}