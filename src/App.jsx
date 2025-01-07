import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login from './components/authentication/Login'
import { supabase } from './supabase/supabse'
import Home from './components/Home/Home'
import AuthCallback from './components/authentication/AuthCallback';

//Ov23liOTHffSjOSCCS4U
//eb25a03e563a1d51c428d3e05373dfebea12e19e



function App() {
  const [count, setCount] = useState(0)

  async function getData() {
    
        let res = await supabase
        .from('Review')
        .select('*')
        console.log(res);
        
  }
  useEffect(()=>{
    getData()
  },[])


  return (
    <Router>
    <div>
      <Routes>
      <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/" element={<Login />} />
        <Route path="/Home" element={<Home />} />
       
      </Routes>
    </div>
  </Router>
  )
}

export default App
