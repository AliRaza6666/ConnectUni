


import { BrowserRouter,Routes,Route} from 'react-router-dom'
import Home from './pages/Home'
import Auth from "./pages/Auth"
import Profile from "./pages/Profile"
import Messages from './pages/messages'
function App() {
     return(
     <BrowserRouter>
      <Routes>
      <Route path='/Home' element={<Home/>}></Route>
      <Route path='/' element={<Auth/>}></Route>
      <Route path='/Profile' element={<Profile/>}></Route>
      <Route path='/Messages' element={<Messages/>}></Route>
      

      </Routes>
     </BrowserRouter>
     )
}

export default App
