import { io } from "socket.io-client";

import React, { useEffect, useRef, useState } from 'react'
import react from "../assets/react.svg"
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import { API_URL } from '../config';


const Messages = () => {
  const socketRef = useRef(null);   //socket is created in one of use effect ,but we have its use in
  //others functions also so we created a refrence for original socket

  const currentRoomRef = useRef(null); // Track current room to leave before joining new one

  const currentUserRef=useRef(null) //message are seen featured required otherUser id
  /// but initial it was null , so it remain null even after when user click on some 
  //other user ,so we need to update null to that user when clicked 
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
  const [onlineUsers,setOnlineUsers]=useState([])
  const [msg,setmsg]=useState("")
  const chatRef=useRef(null)
  const [searchedUsers,setSearchedUsers]=useState([])
  const [search,setSearch]=useState("")



  const handleSearch = async () => {
    try {
      const response = await axios.get(`${API_URL}/searchUser?name=${search}`)
      setSearchedUsers(response.data) 
      console.log(response.data) 
    } catch (err) {
      setSearchedUsers([])
      console.log(err)
    }
  }
  useEffect(()=>{
     ///when we were searching users it starts showing previous search results(bcz condition is still that that search exist ) so 
     //we set it to null when we are not searching so that when we are searching we dont see 
     //previous results
    if(!search){
        setSearchedUsers([])
    }
  },[search])
  


  const deleteMsg=async(data)=>{
    
     try{
          const token=localStorage.getItem("token")
          const res = await axios.delete(
    `${API_URL}/deleteMessage`,
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
        const res=await axios.patch(`${API_URL}/updateMessage/${msgId}`,{
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
    
    // Leave the previous room before joining new one to prevent cross-chat messages
    if (currentRoomRef.current && currentRoomRef.current !== roomId) {
      socketRef.current.emit("leave_room", currentRoomRef.current)
    }
    
    currentRoomRef.current = roomId  // Update current room reference
    socketRef.current.emit("join_room",roomId)
    socketRef.current.emit("mark_seen",{"senderId":user._id,"roomId":roomId})

    const token=localStorage.getItem("token")
    try {
  const res = await axios.get(
    `${API_URL}/getMessages/${roomId}`,
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
    //creating socket inside useeffect bcz we if we create it outside the socket will be created and
    //all events will be listened before components mounts so all events will have no vlaues even after componnet has rendered. (mtlb socket tu conenct hogya tha , server se jo response ane the 
    //wo sare response agye lekin unke listners ready nhi the , r jb we ready houn ge tb unko null
    //vlaues hi milien gi 
    //isliye hum isko use efeect mei  rkhte hain ta k component render ho tb hi sb kuch)
     const socket = io(API_URL,{    //sending token also bcz we want to get user id 
                                               //so that we can get to know which user is online
  auth:{
    token:localStorage.getItem("token")
  }
  

}); 
    socketRef.current=socket
    socket.on("messages_seen",(roomId)=>{
      
        setMessages(prev=>prev.map(
          //we want only the messages for sender to be updated bcz server also 
          //doing same
          (m)=>m.roomId===roomId && m.senderId===currentUserRef.current?.id ? {...m,isSeen:true}:m)
        )
      
    })
     socket.on("receive_message",(data)=>{
      // Only add message if it belongs to the currently open chat room
      if (data.roomId === currentRoomRef.current) {
        setMessages((prev)=>[...prev,data])

        //make newly reciveved msgs as seen
        if(data.senderId !== currentUserRef.current?.id) {
          socketRef.current.emit("mark_seen", {"senderId": data.senderId, "roomId": data.roomId})
        }
      }
    })

    socket.on("message_updated",(updatedMsg)=>{
       setMessages(prev=>prev.map(m=>m._id===updatedMsg._id ? updatedMsg : m))
    })
   

     socket.on("message_Deleted",(updatedMsg)=>{
      setMessages(prev=>prev.map(m=>m._id===updatedMsg._id ? updatedMsg : m))
     })
     
     socket.on("online_users",(onlineUsers)=>{
      console.log(onlineUsers)
      setOnlineUsers(onlineUsers)
     })
     console.log(onlineUsers)

   let fetchUser=async()=>{
         const token=localStorage.getItem("token")
         const user=JSON.parse(localStorage.getItem("user"))
         const res=await axios.get(`${API_URL}/getAllUsers`,{
          headers:{
            authorization:`Bearer ${token}`
          }
         })
         setCurrentUser(user)

         setUsers(res.data.users)
         currentUserRef.current=user
         
   }

   fetchUser()
   
    return ()=>{
      socket.off("receive_message")
      socket.off("message_updated")
      socket.off("receive_Deleted")
      socket.off("online_users")
      

    }
  },[])
  console.log(messages)
  console.log("these are users",onlineUsers)
  const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

    const handleSend=()=>{
      if(!msg.trim()) return ;
       const roomId=[currentUser.id,currentOtherUserId].sort().join("_")
      socketRef.current.emit("send_message",{"senderId":currentUser.id,"text":msg,"roomId":roomId})
      setmsg("")

      

    }
  return (
    <div className='flex cursor-pointer h-screen bg-slate-50 text-slate-800 overflow-hidden'>
        <div className={`bg-slate-100 w-full md:w-[40%] lg:w-[35%] xl:w-[30%] border-r border-slate-200 flex ${flag ? 'hidden md:flex' : 'flex'}`}>
            <div className='border-r border-slate-200 h-screen w-[60px] sm:w-[70px] md:w-[80px] relative bottom-0 flex text-center justify-center items-center text-slate-600 shrink-0'>
              
               <div className='absolute bottom-4 flex flex-col gap-4 sm:gap-5 md:gap-6'>
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 cursor-pointer hover:text-indigo-600 transition-colors" onClick={()=>navigate("/Profile")}> 
                   <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                 </svg>
                 <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 cursor-pointer hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" onClick={()=>navigate("/Home")}> 
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                 </svg>
               </div>
            </div>

            <div className='flex-1 overflow-auto max-h-screen bg-white text-slate-800 [&::-webkit-scrollbar]:hidden
  [-ms-overflow-style:none]
  [scrollbar-width:none]'> 
                
                <div className='px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5'>
                  <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-4 truncate'>
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() + currentUser.name.slice(1).toLowerCase() : ''}
                  </h1>
                  <h2 className='text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3'>Users</h2>
                  <div className='flex mt-2 justify-center mb-3 sm:mb-4'>
                    <input 
                      type="text" 
                      className='border border-slate-300 rounded-2xl h-9 sm:h-10 w-full px-4 bg-slate-50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all' 
                      placeholder='Search users...' 
                      value={search} 
                      onChange={(e)=>setSearch(e.target.value)} 
                      onKeyDown={(e)=>{
                        if(e.key==="Enter"){
                          handleSearch()
                        }
                      }}
                    />
                  </div>
                </div>

                {/* User List */}
                <div className='px-2 sm:px-3 md:px-4'>
                  {currentUser && (search ? searchedUsers : users)
                  .filter(user=>user._id!==currentUser.id)
                  .map((user)=>{
                       const isOnline=onlineUsers.some(u=>u===user._id)
                       
                      
                      return <div key={user._id} className='items-center flex gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-slate-100 active:bg-slate-200 transition-colors rounded-lg cursor-pointer' onClick={()=>handleClick(user)}>
                    <div className='relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 shrink-0'>
                      <div className='w-full h-full rounded-full border-2 border-slate-300 overflow-hidden'>
                        <img src={user.dp} alt={user.name} className='w-full h-full object-cover'/>
                      </div>
                      {isOnline && <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 absolute rounded-full right-0 bottom-0 z-10 border-2 border-white"></span>}
                    </div>
                    <h2 className='text-sm sm:text-base md:text-lg lg:text-xl truncate flex-1'>{user.name}</h2>
                    
                  </div>
                   
                  })}
                </div>
                            
                
            </div>

            

        </div>
        {flag==true && <div className='bg-slate-50 w-full md:w-[60%] lg:w-[65%] xl:w-[70%] border-l border-slate-200 relative flex flex-col'>
          {/* Chat Header */}
          <div className='flex items-center gap-2 sm:gap-3 border-b border-slate-200 p-2 sm:p-3 md:p-4 w-full bg-white shrink-0' >
                  <button className='md:hidden p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded transition-colors' onClick={()=>setFlag(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <div className='w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-2 border-slate-300 overflow-hidden shrink-0'>
                    <img src={currentOtherUserDp} alt={currentOtherUserName} className='w-full h-full object-cover'/>
                  </div>
                  <h2 className='text-base sm:text-lg md:text-xl lg:text-2xl text-slate-800 font-semibold truncate flex-1'>{currentOtherUserName}</h2>
                </div>
                
                {/* Messages Container */}
                <div className="flex-1 overflow-auto p-2 sm:p-3 md:p-4 flex flex-col w-full gap-2 sm:gap-3 [&::-webkit-scrollbar]:hidden
  [-ms-overflow-style:none]
  [scrollbar-width:none]" ref={chatRef} onClick={()=>setOptionsMsgId(null)}>
            {messages.length!=0 &&  messages.map((data,index)=>{
                   const isCurrentUser=currentUser.id===data.senderId
                   const isOnline=onlineUsers.includes(currentOtherUserId)
                   const isSender=currentUser.id===data.senderId

                  
                   return <div key={index}  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} w-full`}>
                    <div
  className={`
    relative px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm md:text-base leading-relaxed max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] w-fit
    rounded-2xl shadow-sm overflow-wrap-anywhere
    ${isCurrentUser
      ? "bg-indigo-600 text-white rounded-br-none"
      : "bg-slate-200 text-slate-800 rounded-bl-none"}
      ${data.isDeleted ? "bg-slate-300 italic text-slate-600" : ""}` } 
  
  onClick={(e)=>{
    if(isCurrentUser && !data.isDeleted){
    e.stopPropagation()    //stop onclick on parent(which set optionsMsgId to null)from activating(which behavior is called event bubbling)
    setOptionsMsgId(data._id)}
    }}
>
           <div className='whitespace-pre-wrap overflow-wrap-anywhere'>{data.text}</div>
           <div className={`flex items-center justify-end gap-1 mt-1 ${isCurrentUser ?  "text-slate-300" : "text-slate-500"}`}>
            <p className="text-[9px] sm:text-[10px] text-end whitespace-nowrap">{formatTime(data.createdAt)}</p>
            {!data.isDeleted && <>
            {isSender && 
            <div className='flex items-center shrink-0'>
            
            {isOnline ? <>
            {data.isSeen===true ? <svg width="16" height="14" className='sm:w-[18px] sm:h-[16px]' fill="none" viewBox="0 0 28 20">
  <path d="M7 11l4 4 8-10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M13 11l4 4 6-8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg> : <svg width="16" height="14" className='sm:w-[18px] sm:h-[16px]' fill="none" viewBox="0 0 28 20">
  <path d="M7 11l4 4 8-10" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M13 11l4 4 6-8" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>}
            </>:<svg width="14" height="14" className='sm:w-[16px] sm:h-[16px]' fill="none" viewBox="0 0 24 24">
  <path d="M6 13l4 4L18 8" stroke="#a5b4fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

}</div>}</>}
            </div>
            {optionsMsgId === data._id && (
    <div
      className={`
        absolute z-20 -top-10 sm:-top-12
        ${isCurrentUser ? "right-0" : "left-0"}
        w-20 sm:w-24 bg-white text-slate-800 rounded-lg shadow-lg border border-slate-200
      `}
    >
      <div className="p-2 sm:p-2.5 hover:bg-slate-100 cursor-pointer text-xs sm:text-sm rounded-t-lg transition-colors" onClick={()=>{
        
        setEditingMsg(data._id)
      
        }}>Edit</div>
      <div className="p-2 sm:p-2.5 hover:bg-slate-100 cursor-pointer text-xs sm:text-sm rounded-b-lg transition-colors" onClick={()=>deleteMsg(data)}>Delete</div>
    </div>
  )}
          </div>
            
         </div>
        
          })}
          
         
          </div>
         

          {/* Message Input */}
          <div className='shrink-0 p-2 sm:p-3 md:p-4 bg-slate-50 border-t border-slate-200'>
            <div className='flex justify-center items-center gap-2 sm:gap-3'>
               <input 
                 type="text" 
                 value={msg} 
                 onChange={(e)=>setmsg(e.target.value)} 
                 className='flex-1 border border-slate-300 text-slate-800 bg-white rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 md:py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all' 
                 placeholder='Type a message...'
                 onKeyDown={(e)=>{
                   if(e.key==="Enter") handleSend()
                 }}
               />
               <button 
                 className='px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg sm:rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 text-sm sm:text-base font-medium shrink-0 transition-colors shadow-sm' 
                 onClick={handleSend}
               >
                 Send
               </button>
            </div>
          </div>
         
        </div>}
        
        {editingMsg && <>
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-sm z-50 p-4 sm:p-6">
          <div className="w-full max-w-[90%] sm:max-w-md md:max-w-lg text-slate-800 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-7 shadow-2xl">
            <h2 className="text-lg sm:text-xl md:text-2xl text-center font-semibold mb-4 sm:mb-5">Edit Message</h2>
            <div className="border-2 border-slate-300 focus-within:border-indigo-500 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-colors">
              <input 
                type="text" 
                placeholder="Enter Your Message" 
                className="outline-none w-full text-sm sm:text-base" 
                value={editedMsg} 
                onChange={(e)=>setEditedMsg(e.target.value)}
                onKeyDown={(e)=>{
                  if(e.key==="Enter"){
                    updateMsg(editingMsg)
                    setEditingMsg(null)
                  }
                }}
              />
            </div>
            <div className="flex justify-end mt-4 sm:mt-5 gap-2 sm:gap-3">
              <button 
                className="px-4 py-2 sm:px-5 sm:py-2.5 border-2 border-slate-300 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 text-sm sm:text-base font-medium transition-colors" 
                onClick={()=>setEditingMsg(null)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 text-sm sm:text-base font-medium transition-colors shadow-sm" 
                onClick={()=>{
                  updateMsg(editingMsg)
                  setEditingMsg(null)
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
        
        </>}

    </div>
  )
}

export default Messages
