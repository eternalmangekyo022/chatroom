import { WebSocketServer } from 'ws';
import mysql from 'mysql2';
import express from 'express';
import http from 'http';
import { v4 as uuid } from 'uuid';
import cors from 'cors';
//const uuids = [];

const app = express()
app.use(express.json())
app.use(cors())

const server = http.createServer(app);
const ws = new WebSocketServer({ server }, () => console.log(port))

const database = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'chatroom'
})

const db = {
	query: (q, val) => new Promise((res, rej) => {
		database.query(q, val, (err, q) => {
			if(err) rej(err)
			res(q)
		})
	})
}

app.get('/', async(_, res) => res.json(await db.query('select * from users')))

app.post('/login', async({ body: { username, password } }, res) => {
	const users = await db.query('select * from users where username = ? and password = ?', [username, password])
	const id = uuid()
	if(users.length) {
		await db.query('insert into clients(userId, uuid) values(?, ?)', [users[0].id, id])
		res.json({ status: 'success', user: { ...users[0], uuid: id } })
	}
	else res.status(401).json({ status: 'error', message: 'unauthenticated' })
})

app.post('/token', async({ body: { token } }, res) => {
	const clients = await db.query('select * from users where id = (select userId from clients where uuid = ?)', token)
	if(!clients.length) res.status(401).json({ status: 'error', message: 'token outdated or not valid', token })
	else res.json({ status: 'success', user: { ...clients[0], uuid: token } })
})

const port = 3000;
const addresses = ['192.168.1.100', 'localhost'];
const address = 1;

const now = {
		toString: () => {
		const now = new Date();
		const final = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
		console.log(final)
		return final
	}
}

ws.on('connection', async s => {
	s.onmessage = async({ data }) => {
		data = JSON.parse(data)
		switch(data.type) {
			//message: { type: message, payload: string, sender: int(id), reciever int(id), date: date }
			case 'message':
				var { payload, sender, reciever, id } = data;
				var ids = (await db.query('select uuid from clients')).map(i => i.uuid)
				if(!ids.includes(id)) {
					s.close(1002, JSON.stringify({ status: 'error', message: 'unauthorized' }))
				} else {
					s.id = id;
				}
				db.query('insert into messages(sender, reciever, text, date) values(?, ?, ?, ?)', [sender, reciever, payload, now.toString()])
				console.log(`=> ${data.payload}`)
				break
		}
	}
})

server.listen(port, addresses[address], null, () => console.log(port))