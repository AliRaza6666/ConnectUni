import { io } from "socket.io-client";
const socket = io("http://localhost:5000"); 
import React, { useEffect, useRef, useState } from 'react'
import react from "../assets/react.svg"
import { useNavigate } from 'react-router-dom'
import axios from 'axios';


const Messages = () => {
  const [editingMsg,setEditingMsg]=useState(null)
  
  const [optionsMsgId,setOptionsMsgId]=useState(null)
  const [editedMsg,setEditedMsg]=useState("")
  const navigate = useNavigate();
  const [flag,setFlag]=useState(false)
  const [users,setUsers]=useState([])
  const [currentOtherUserName,setCurrentOtherUserName]=useState("")
  const [currentOtherUserId,setCurrentOtherUserId]=useState("")
  const [currentUser,setCurrentUser]=useState("")
  const [currentOtherUserDp,setCurrentOtherUserDp]=useState("")
  const [messages,setMessages]=useState([])
  const [msg,setmsg]=useState("")
  const chatRef=useRef(null)


  const deleteMsg=async(data)=>{
    
     try{
          const token=localStorage.getItem("token")
          const res = await axios.delete(
    `http://localhost:5000/deleteMessage`,
    {
     data:data,
     headers: {
        authorization: `Bearer ${token}`,
      },
    }
  ); 
     setOptionsMsgId(null)
     
     }
     catch(err){
        console.log(err)
        
     }
  }
  const updateMsg=async(msgId)=>{
    try{
        
        const token=localStorage.getItem("token")
        const res=await axios.patch(`http://localhost:5000/updateMessage/${msgId}`,{
          text:editedMsg},
          {headers:{
            authorization: `Bearer ${token}`
          }
        })
        console.log(res)
        setOptionsMsgId(null)    //to close edit/delete options
        setEditedMsg(null)      ///to make input empty for new msgs edits
    }
    catch(err){
      console.log(err)
    }

  }

  useEffect(()=>{
      if(!chatRef.current) return
      chatRef.current.scrollTop = chatRef.current.scrollHeight;

  },[messages])

  const handleClick=async (user) =>{
    
    setFlag(true)
    setCurrentOtherUserId(user._id)

    setCurrentOtherUserName(user.name)
    setCurrentOtherUserDp(user.dp)
    const roomId=[currentUser.id,user._id].sort().join("_")
    
    socket.emit("join_room",roomId)
    const token=localStorage.getItem("token")
    try {
  const res = await axios.get(
    `http://localhost:5000/getMessages/${roomId}`,
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }
  );
  setMessages([])
  setMessages(res.data)
 

} 

    catch(err){
      console.log(err.msg)

    }
    
    
    

  }
  console.log(setCurrentOtherUserId)

  useEffect(()=>{
     socket.on("receive_message",(data)=>{
      setMessages((prev)=>[...prev,data])
    })

    socket.on("message_updated",(updatedMsg)=>{
       setMessages(prev=>prev.map(m=>m._id===updatedMsg._id ? updatedMsg : m))
    })
   

     socket.on("message_Deleted",(updatedMsg)=>{
      setMessages(prev=>prev.map(m=>m._id===updatedMsg._id ? updatedMsg : m))
     })


   let fetchUser=async()=>{
         const token=localStorage.getItem("token")
         const user=JSON.parse(localStorage.getItem("user"))
         const res=await axios.get("http://localhost:5000/getAllUsers",{
          headers:{
            authorization:`Bearer ${token}`
          }
         })
         setCurrentUser(user)
         setUsers(res.data.users)
         
   }

   fetchUser()
   
    return ()=>{
      socket.off("receive_message")
      socket.off("message_updated")
      socket.off("receive_Deleted")

    }
  },[])
  console.log(messages)
  const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

    const handleSend=()=>{
      if(!msg.trim()) return ;
       const roomId=[currentUser.id,currentOtherUserId].sort().join("_")
      socket.emit("send_message",{"senderId":currentUser.id,"text":msg,"roomId":roomId})
      setmsg("")

      

    }
  return (
    <div className='flex cursor-pointer h-screen bg-gray-900 text-white '>
        <div className='bg-white-400 w-[30%] border flex '>
            <div className='border h-screen w-[20%] relative bottom-0 flex text-center justify-center items-center'>
              
               <div className='absolute bottom-4 flex flex-col gap-5'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8" onClick={()=>navigate("/Profile")}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>

                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" onClick={()=>navigate("/Home")}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
                
               </div>
            </div>
            <div className='w-full overflow-auto max-h-screen bg-gray-700 text-white [&::-webkit-scrollbar]:hidden
  [-ms-overflow-style:none]
  [scrollbar-width:none]'> 
                
                <div className='m-5 text-3xl  bold'>
                  {currentUser.name}
                </div>
                <div className='text-2xl bold border-b width-[100%]'>Users</div>
                <div className='flex ml-2 mt-2'>
                  <input type="text" className='border rounded-2xl h-8 w-[80%] text-center' placeholder='Search'/>
                  
                </div>

                
                {currentUser && users
                .filter(user=>user._id!==currentUser.id)
                
                .map((user)=>{
                 
                    
                    return <div key={user._idid} className='items-center flex gap-3 p-2 hover:bg-gray-600 transition rounded-lg' onClick={()=>handleClick(user)}>
                  <div className='size-15  rounded-4xl border flex justify-center overflow-hidden'>
                  <img src={user.dp} alt="" className='w-full h-full '/>
                  </div>
                  <h2 className='text-2xl'>{user.name}</h2>
                </div>
                 
                })}
                            
                
            </div>

            

        </div>
        {flag==true && <div className='bg-gray-400 w-[70%] border relative '>
          <div  className='flex gap-2 border p-2 w-full bg-gray-700' >
                  <div className='size-15  rounded-4xl border flex justify-center overflow-hidden'>
                  <img src={currentOtherUserDp} alt="" className='w-full h-full '/>
                  </div>
                  <h2 className='text-2xl text-white'>{currentOtherUserName}</h2>
                </div>
                <div className="max-h-105 overflow-auto   p-2 flex flex-col w-full gap-2 [&::-webkit-scrollbar]:hidden
  [-ms-overflow-style:none]
  [scrollbar-width:none]" ref={chatRef} onClick={()=>setOptionsMsgId(null)}>
            {messages.length!=0 &&  messages.map((data,index)=>{
                   const isCurrentUser=currentUser.id===data.senderId

                  
                   return <div key={index}  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} w-full `}>
                    <div
  className={`
    relative px-4 py-2 text-sm leading-relaxed max-w-[65%] w-fit
    rounded-2xl shadow-sm
    ${isCurrentUser
      ? "bg-[#28685c] text-[#e9edef] rounded-br-none"
      : "bg-[#347ba3] text-[#e9edef] rounded-bl-none"}
      ${data.isDeleted ? "bg-gray-500 italic text-gray-200" : ""}` } 
  
  onClick={(e)=>{
    if(isCurrentUser && !data.isDeleted){
    e.stopPropagation()    //stop onclick on parent(which set optionsMsgId to null)from activating(which behavior is called event bubbling)
    setOptionsMsgId(data._id)}
    }}
>
           {data.text}
           <div className="flex justify-end text-gray-300">
            <p className="text-[10px] text-end">{formatTime(data.createdAt)}</p>
            </div>
            {optionsMsgId === data._id && (
    <div
      className={`
        absolute z-20 -top-2 mt-1
        ${isCurrentUser ? "right-0" : "left-0"}
        w-24 bg-white text-black rounded shadow-md
      `}
    >
      <div className="p-2 hover:bg-gray-200 cursor-pointer" onClick={()=>{
        
        setEditingMsg(data._id)
      
        }}>Edit</div>
      <div className="p-2 hover:bg-gray-200 cursor-pointer" onClick={()=>deleteMsg(data)}>Delete</div>
    </div>
  )}
          </div>
            
         </div>
        
          })}
          
         
          </div>
         


          <div className='absolute bottom-2 '>
            <div className='flex justify-center items-center gap-1'>
               <input type="text" value={msg} onChange={(e)=>setmsg(e.target.value)} className='w-200 border text-white bg-gray-700 rounded p-2 outline-none ml-1' placeholder='enter your message here'
               onKeyDown={(e)=>{
                if(e.key==="Enter") handleSend()
               }}/>
               <button className='border px-3 py-3 rounded  bg-gray-700 text-white' 
                onClick={handleSend}
                >Send</button>
            </div>
          </div>
         
        </div>}
        
        {editingMsg && <>
        <div className="absolute flex justify-center items-center h-screen w-screen">
        <div className="  w-90 text-black bg-white rounded p-3">
          <h2 className="text-2xl text-center">Message Edit</h2>
        <div className="border p-2 mt-5 rounded">
        <input type="text" placeholder="Enter Your Message" className="outline-none boorder w-full " value={editedMsg} onChange={(e)=>setEditedMsg(e.target.value)}/>
        </div>
        <div className="flex justify-end mt-2">
        <button className="mt-3 p-2 border rounded bg-gray-400" onClick={()=>{
          updateMsg(editingMsg)
          setEditingMsg(null)}}>Send</button>
        </div>
        </div>
        </div>
        
        </>}

    </div>
  )
}

export default Messages