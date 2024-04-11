import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {Route,Routes,BrowserRouter} from 'react-router-dom'
// import Editor from './component/editor'
// import EditorPage from './component/editor2'
import Editor from './pages/editor'
import Home from './pages/Home'
import { Toaster } from 'react-hot-toast';



function App() {
  return (
    <>
    <div>
        <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
                success: {
                    theme: {
                        primary: '#4aed88',
                    },
                },
            }}
        ></Toaster>
      </div>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/editor/:roomId' element={<Editor/>}/>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
