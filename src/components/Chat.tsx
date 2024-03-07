interface IconProps {
	src?: string
	children?: React.ReactNode
}

function Icon({ src, children }: IconProps) {
	const className = 'w-[70%] aspect-square rounded-full'

	return src ? <img src={src} className={className} />: children && <div className={className + ' bg-slate-600 flex justify-center items-center text-white'}>{children}</div>
}

export default function Chat({ lastMessage, userId, name, src, onClick }: Omit<IChat, "messages"> & { src?: 'string', onClick: (id: number) => void }) {

	return <div className='w-full h-20 border-b-2 flex select-none cursor-pointer' onClick={() => onClick(userId)}>
		<div className='w-[30%] h-full flex justify-center items-center'>
			<Icon>{src ? src: name[0].toUpperCase()}</Icon>
		</div>
		<div className='w-[70%] h-full flex flex-col justify-center gap-[5%] ml-[5%]'>
			<strong>{name}</strong>
			<span className='truncate'>{lastMessage}</span>
		</div>
	</div>
}