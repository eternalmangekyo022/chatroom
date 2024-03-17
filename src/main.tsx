//import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import Index from './routes/Index.tsx'
import Login from './routes/Login.tsx'
import Messages from './routes/Messages.tsx'
import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import './index.css'


const router = createBrowserRouter([
  {
    path: '/',
    element: <Index/>
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/messages',
    element: <Messages />
  }
])

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
      <div className='w-screen h-screen relative overflow-hidden bg-gradient-to-b from-rose-400 to-rose-800'>
          <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
)
