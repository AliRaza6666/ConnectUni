import { useEffect, useRef, useState, useCallback } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { FaUserCircle, FaRegHeart, FaEllipsisV, FaPlus, FaTimes, FaSignOutAlt } from "react-icons/fa"
import { API_URL } from "../config"

function Home() {
  const [feed, setFeed] = useState([])
  const [stories, setStories] = useState([])
  const [allStories, setAllStories] = useState([]) // Stories with media
  const [currentUserDp, setCurrentUserDp] = useState("")
  const [currentUserName, setCurrentUserName] = useState("")
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [viewerStories, setViewerStories] = useState([]) // Stories to display in viewer (filtered by user)
  const [storyProgress, setStoryProgress] = useState(0)
  const [isUploadingStory, setIsUploadingStory] = useState(false)
  const [storyPreview, setStoryPreview] = useState(null)
  const [storyPreviewType, setStoryPreviewType] = useState(null)
  const [isUploadingPost, setIsUploadingPost] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)
  const storyInputRef = useRef(null)
  const videoRefs = useRef({})
  const storyVideoRef = useRef(null)
  const currentlyPlayingRef = useRef(null)
  const progressIntervalRef = useRef(null)
  const feedEndRef = useRef(null)
  const originalFeed = useRef([])
  const navigate = useNavigate()

  // Fetch current user data and all feed data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const storedUser = localStorage.getItem("user")
        
        // Get current user info from localStorage
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setCurrentUserName(user.name || "")
        }

        // Fetch current user's DP
        try {
          const dpRes = await axios.get(`${API_URL}/getDp`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setCurrentUserDp(dpRes.data.dp || "")
        } catch (err) {
          console.error("Error fetching DP:", err)
        }

        // Fetch all media (posts and users)
        const res = await axios.get(
          `${API_URL}/getAllMedia`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const users = res.data.media || []

        // Filter stories - exclude current user, only users with DPs
        const storyUsers = users.filter(u => u.dp && u.name !== currentUserName)
        setStories(storyUsers)

        // Fetch all stories with media
        try {
          const storiesRes = await axios.get(`${API_URL}/getAllStories`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (storiesRes.data.stories) {
            setAllStories(storiesRes.data.stories)
          }
        } catch (err) {
          console.error("Error fetching stories:", err)
        }

        // Sort posts by creation date (newest first) and flatten
        const allPosts = []
        users.forEach(user => {
          if (user.media && user.media.length > 0) {
            user.media.forEach(post => {
              allPosts.push({
                ...post,
                userName: user.name,
                userDp: user.dp,
                createdAt: post.createdAt || new Date(),
                // Assign random likes if likes is 0, undefined, or null
                likes: (post.likes && post.likes > 0) ? post.likes : Math.floor(Math.random() * 10000) + 100
              })
            })
          }
        })

        // Sort by creation date (newest first)
        allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        originalFeed.current = allPosts
        setFeed(allPosts)
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()

    
  }, [currentUserName])

  // Intersection Observer for video autoplay
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5 // Video must be at least 50% visible
    }

    // Handle video visibility changes
    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        const video = entry.target
        const videoId = video.dataset.videoId

        if (isStoryViewerOpen) {
          if (video && !video.paused) {
            video.pause()
          }
          return
        }

        if (entry.isIntersecting) {
          // Pause currently playing video if different
          if (currentlyPlayingRef.current && currentlyPlayingRef.current !== video) {
            currentlyPlayingRef.current.pause()
          }
          
          // Start muted for autoplay to work (browsers require this)
          video.muted = true
          
          // Play the video in viewport
          video.play().then(() => {
            // Unmute immediately after video starts playing for sound
            setTimeout(() => {
              video.muted = false
            }, 100)
          }).catch(err => {
            console.log("Autoplay prevented:", err)
          })
          
          currentlyPlayingRef.current = video
        } else {
          // Pause video when it leaves viewport
          if (video === currentlyPlayingRef.current) {
            video.pause()
            currentlyPlayingRef.current = null
          }
        }
      })
    }

    const observer = new IntersectionObserver(handleIntersection, observerOptions)

    // Observe all video elements
    Object.values(videoRefs.current).forEach((videoRef) => {
      if (videoRef) {
        observer.observe(videoRef)
      }
    })

    // Cleanup
    return () => {
      Object.values(videoRefs.current).forEach((videoRef) => {
        if (videoRef) {
          observer.unobserve(videoRef)
        }
      })
    }
  }, [feed, isStoryViewerOpen])

  // Sliding window infinite scroll - maintains constant memory
  useEffect(() => {
    const POSTS_TO_CYCLE = 5

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && originalFeed.current.length >= POSTS_TO_CYCLE) {
          setFeed(prev => {
            if (prev.length === 0) return prev
            
            // Get posts to move to end (first N from original)
            const postsToAdd = originalFeed.current.slice(0, POSTS_TO_CYCLE)
            
            // Remove first N posts, add them to end
            const newFeed = [...prev.slice(POSTS_TO_CYCLE), ...postsToAdd]
            
            // Rotate original feed reference for next cycle
            originalFeed.current = [
              ...originalFeed.current.slice(POSTS_TO_CYCLE),
              ...originalFeed.current.slice(0, POSTS_TO_CYCLE)
            ]
            
            return newFeed
          })
          
          // Optional: Smooth scroll up slightly to hide the transition
          setTimeout(() => {
            window.scrollBy({ top: -300, behavior: 'smooth' })
          }, 100)
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '0px'
      }
    )

    const currentElement = feedEndRef.current
    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [feed])

  // Handle post upload
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB')
      e.target.value = null
      return
    }

    const previewUrl = URL.createObjectURL(file)
    const isVideo = file.type.startsWith("video")
    setIsUploadingPost(true)
    setUploadProgress(0)

    const tempPost = {
      _id: "temp_" + Date.now(),
      url: previewUrl,
      type: isVideo ? "video" : "image",
      userName: currentUserName,
      userDp: currentUserDp,
      createdAt: new Date(),
      likes: 0,
      isUploading: true
    }
    setFeed(prev => [tempPost, ...prev])

    const formData = new FormData()
    formData.append("media", file)

    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${API_URL}/addPost`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          }
        }
      )

      if (res.data.status === 200) {
        // Update with real post ID from backend
        const realPost = {
          _id: res.data.postId,
          url: res.data.url,
          type: isVideo ? "video" : "image",
          userName: currentUserName,
          userDp: currentUserDp,
          createdAt: new Date(),
          likes: 0
        }
        setFeed(prev => [realPost, ...prev.filter(p => p._id !== tempPost._id)])
      }
    } catch (err) {
      console.error("Upload failed:", err)
      setFeed(prev => prev.filter(p => p._id !== tempPost._id))
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploadingPost(false)
      setUploadProgress(0)
      URL.revokeObjectURL(previewUrl)
    }

    e.target.value = null
  }

  // Handle story upload
  const handleStoryUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB')
      e.target.value = null
      return
    }

    const previewUrl = URL.createObjectURL(file)
    const isVideo = file.type.startsWith("video")
    setStoryPreview(previewUrl)
    setStoryPreviewType(isVideo ? "video" : "image")
    setIsUploadingStory(true)

    const tempStory = {
      _id: "temp_" + Date.now(),
      mediaUrl: previewUrl,
      mediaType: isVideo ? "video" : "image",
      userName: currentUserName,
      userDp: currentUserDp,
      createdAt: new Date(),
      isUploading: true
    }
    setAllStories(prev => [tempStory, ...prev.filter(s => s.userName !== currentUserName)])

    const formData = new FormData()
    formData.append("media", file)

    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${API_URL}/addStory`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (res.status === 200) {
        // Update with real story data instead of refetching all stories
        const realStory = {
          _id: Date.now().toString(),
          mediaUrl: res.data.url || previewUrl,
          mediaType: isVideo ? "video" : "image",
          userName: currentUserName,
          userDp: currentUserDp,
          createdAt: new Date()
        }
        setAllStories(prev => [realStory, ...prev.filter(s => s._id !== tempStory._id && s.userName !== currentUserName)])
      }
    } catch (err) {
      console.error("Story upload failed:", err)
      setAllStories(prev => prev.filter(s => s._id !== tempStory._id))
      alert('Story upload failed. Please try again.')
    } finally {
      setIsUploadingStory(false)
      setStoryPreview(null)
      setStoryPreviewType(null)
      URL.revokeObjectURL(previewUrl)
    }

    e.target.value = null
  }

  // Open story viewer - filter to show only clicked user's story
  const openStoryViewer = (clickedStory) => {
    Object.values(videoRefs.current).forEach((videoRef) => {
      if (videoRef && !videoRef.paused) {
        videoRef.pause()
      }
    })
    if (currentlyPlayingRef.current) {
      currentlyPlayingRef.current.pause()
      currentlyPlayingRef.current = null
    }
    
    // Filter stories to only show the clicked user's story
    const userStories = allStories.filter(s => s.userName === clickedStory.userName)
    setViewerStories(userStories)
    setCurrentStoryIndex(0) // Always start at first story of that user
    setIsStoryViewerOpen(true)
    setStoryProgress(0)
  }

  // Close story viewer
  const closeStoryViewer = useCallback(() => {
    setIsStoryViewerOpen(false)
    setCurrentStoryIndex(0)
    setStoryProgress(0)
    setViewerStories([])
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (storyVideoRef.current) {
      storyVideoRef.current.pause()
    }
    
  }, [])

  // Navigate to next story
  const nextStory = useCallback(() => {
    setCurrentStoryIndex(prev => {
      if (prev < viewerStories.length - 1) {
        setStoryProgress(0)
        return prev + 1
      } else {
        closeStoryViewer()
        return prev
      }
    })
  }, [viewerStories.length, closeStoryViewer])

  // Navigate to previous story
  const prevStory = useCallback(() => {
    setCurrentStoryIndex(prev => {
      if (prev > 0) {
        setStoryProgress(0)
        return prev - 1
      }
      return prev
    })
  }, [])

  // Handle story progress animation
  useEffect(() => {
    if (!isStoryViewerOpen || viewerStories.length === 0) return

    const currentStory = viewerStories[currentStoryIndex]
    if (!currentStory) return

    setStoryProgress(0)

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    // Handle video stories
    if (currentStory.mediaType === "video" && storyVideoRef.current) {
      const video = storyVideoRef.current
      video.currentTime = 0
      video.play().catch(err => console.log("Video play error:", err))

      const updateProgress = () => {
        if (video.duration) {
          const progress = (video.currentTime / video.duration) * 100
          setStoryProgress(progress)
          if (progress >= 100) {
            nextStory()
          }
        }
      }

      video.addEventListener("timeupdate", updateProgress)
      video.addEventListener("ended", nextStory)

      return () => {
        video.removeEventListener("timeupdate", updateProgress)
        video.removeEventListener("ended", nextStory)
      }
    } else {
      // Handle image stories - 5 seconds
      const duration = 5000
      const interval = 50
      let elapsed = 0

      progressIntervalRef.current = setInterval(() => {
        elapsed += interval
        const progress = (elapsed / duration) * 100
        setStoryProgress(progress)

        if (progress >= 100) {
          clearInterval(progressIntervalRef.current)
          setTimeout(nextStory, 100)
        }
      }, interval)

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      }
    }
  }, [isStoryViewerOpen, currentStoryIndex, viewerStories, nextStory])

  useEffect(() => {
    if (isStoryViewerOpen) {
      Object.values(videoRefs.current).forEach((videoRef) => {
        if (videoRef && !videoRef.paused) {
          videoRef.pause()
        }
      })
      if (currentlyPlayingRef.current) {
        currentlyPlayingRef.current.pause()
        currentlyPlayingRef.current = null
      }
    }
  }, [isStoryViewerOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isStoryViewerOpen) return

    const handleKeyPress = (e) => {
      if (e.key === "ArrowRight") nextStory()
      else if (e.key === "ArrowLeft") prevStory()
      else if (e.key === "Escape") closeStoryViewer()
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isStoryViewerOpen, nextStory, prevStory, closeStoryViewer])

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FFFFFF'}}>
      {/* ================= HEADER ================= */}
      <div className="sticky top-0 left-0 right-0 z-50" style={{backgroundColor: '#FFFFFF', borderBottom: '1px solid #DBDBDB'}}>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/logo.png" 
              alt="CONNECTUNI" 
              className="h-14 sm:h-16 md:h-20 w-auto object-contain"
            />
            
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 sm:p-2 rounded-full transition-colors"
              style={{color: '#262626'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Create post"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button onClick={()=>navigate("/messages")} className="p-1.5 sm:p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
</svg>
</button>


            <button
              onClick={() => navigate("/Profile")}
              className="cursor-pointer"
              aria-label="Profile"
            >
              {currentUserDp ? (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden">
                  <img
                    src={currentUserDp}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <FaUserCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{color: '#262626'}} />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-full transition-colors"
              style={{color: '#262626'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Logout"
              title="Logout"
            >
              <FaSignOutAlt className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= STORIES SECTION ================= */}
      <div style={{borderBottom: '1px solid #DBDBDB', backgroundColor: '#FFFFFF'}}>
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2">
            {/* Current User's Story */}
            {(() => {
              const currentUserStory = allStories.find(s => s.userName === currentUserName)
              
              if (currentUserStory) {
                // User has a story - show it like other stories with plus icon
                return (
                  <div 
                    className="flex flex-col items-center min-w-[60px] sm:min-w-[70px] cursor-pointer"
                    onClick={() => !currentUserStory.isUploading && openStoryViewer(currentUserStory)}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px]" style={{background: 'linear-gradient(to right, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'}}>
                        <div className="w-full h-full rounded-full bg-white p-[2px]">
                          {currentUserDp ? (
                            <img
                              src={currentUserDp}
                              alt={currentUserName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full flex items-center justify-center" style={{backgroundColor: '#FAFAFA'}}>
                              <FaUserCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{color: '#8E8E8E'}} />
                            </div>
                          )}
                        </div>
                        {/* Loading overlay */}
                        {currentUserStory.isUploading && (
                          <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      {/* Plus icon to change story */}
                      {!isUploadingStory && (
                        <div 
                          className="absolute bottom-0 right-0 rounded-full p-1 border-2 cursor-pointer z-10"
                          style={{backgroundColor: '#0095F6', borderColor: '#FFFFFF'}}
                          onClick={(e) => {
                            e.stopPropagation()
                            storyInputRef.current?.click()
                          }}
                        >
                          <FaPlus size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs mt-1.5 font-normal truncate max-w-[60px] sm:max-w-[70px] text-center" style={{color: '#262626'}}>
                      {isUploadingStory ? 'UPLOADING...' : (currentUserName?.toUpperCase() || 'YOUR STORY')}
                    </span>
                  </div>
                )
              } else {
                // User doesn't have a story - show "Your story" placeholder
                return (
                  <div 
                    className="flex flex-col items-center min-w-[60px] sm:min-w-[70px] cursor-pointer"
                    onClick={() => !isUploadingStory && storyInputRef.current?.click()}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px]" style={{border: '2px solid #DBDBDB'}}>
                        {currentUserDp ? (
                          <img
                            src={currentUserDp}
                            alt="Your story"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full flex items-center justify-center" style={{backgroundColor: '#FAFAFA'}}>
                            <FaUserCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{color: '#8E8E8E'}} />
                          </div>
                        )}
                        {/* Loading overlay */}
                        {isUploadingStory && (
                          <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      {!isUploadingStory && (
                        <div className="absolute bottom-0 right-0 rounded-full p-1 border-2" style={{backgroundColor: '#0095F6', borderColor: '#FFFFFF'}}>
                          <FaPlus size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs mt-1.5 font-normal truncate max-w-[60px] sm:max-w-[70px] text-center" style={{color: '#262626'}}>
                      {isUploadingStory ? 'UPLOADING...' : 'Your story'}
                    </span>
                  </div>
                )
              }
            })()}

            {/* Other Users' Stories */}
            {allStories
              .filter(story => story.userName !== currentUserName)
              .map((story, index) => {
                const storyUser = stories.find(u => u.name === story.userName)
                if (!storyUser) return null
                
                return (
                  <div 
                    key={index} 
                    className="flex flex-col items-center min-w-[60px] sm:min-w-[70px] cursor-pointer"
                    onClick={() => openStoryViewer(story)}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px]" style={{background: 'linear-gradient(to right, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'}}>
                      <div className="w-full h-full rounded-full bg-white p-[2px]">
                        <img
                          src={story.userDp || storyUser.dp}
                          alt={story.userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs mt-1.5 font-normal truncate max-w-[60px] sm:max-w-[70px] text-center" style={{color: '#262626'}}>
                      {story.userName?.toUpperCase()}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* ================= FEED SECTION ================= */}
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {feed.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-base sm:text-lg" style={{color: '#8E8E8E'}}>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          <>
            {feed.map((post, index) => (
              <div
                key={`${post._id}-${index}`}
                className="mb-4 sm:mb-6 overflow-hidden rounded-sm"
                style={{backgroundColor: '#FFFFFF', border: '1px solid #DBDBDB'}}
              >
              {/* Post Header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3" style={{borderBottom: '1px solid #DBDBDB'}}>
                <div className="flex items-center gap-2 sm:gap-3">
                  {post.userDp ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0">
                      <img
                        src={post.userDp}
                        alt={post.userName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#FAFAFA'}}>
                      <FaUserCircle className="w-5 h-5 sm:w-6 sm:h-6" style={{color: '#8E8E8E'}} />
                    </div>
                  )}
                  <span className="font-semibold text-xs sm:text-sm" style={{color: '#262626'}}>
                    {post.userName?.toUpperCase()}
                  </span>
                </div>
                <button
                  className="p-1 transition-opacity hover:opacity-70"
                  aria-label="More options"
                >
                  <FaEllipsisV className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{color: '#262626'}} />
                </button>
              </div>

              {/* Media Content */}
              {post.type === "image" && (
                <div className="w-full max-h-[400px] overflow-hidden bg-black flex items-center justify-center relative">
                  <img
                    src={post.url}
                    alt="Post"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                  {post.isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-white text-sm font-medium">Uploading...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {post.type === "video" && (
                <div className="w-full max-h-[400px] overflow-hidden bg-black relative">
                  <video
                    ref={(el) => {
                      if (el) {
                        videoRefs.current[`video-${index}`] = el
                        el.dataset.videoId = `video-${index}`
                        const handlePlay = () => {
                          if (el.muted) {
                            setTimeout(() => {
                              el.muted = false
                            }, 100)
                          }
                        }
                        el.addEventListener('play', handlePlay)
                      }
                    }}
                    src={post.url}
                    controls
                    playsInline
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                  {post.isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-white text-sm font-medium">Uploading...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="px-3 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-3 sm:gap-4 mb-2">
                  <button
                    className="p-1 hover:opacity-70 transition-opacity"
                    aria-label="Like"
                  >
                    <FaRegHeart className="w-5 h-5 sm:w-6 sm:h-6" style={{color: '#262626'}} />
                  </button>
                  <button
                    className="p-1 hover:opacity-70 transition-opacity"
                    aria-label="Comment"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#262626'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  <button
                    className="p-1 hover:opacity-70 transition-opacity"
                    aria-label="Share"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#262626'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
                {post.likes !== undefined && (
                  <div className="text-xs sm:text-sm font-semibold" style={{color: '#DC2626'}}>
                    {post.likes.toLocaleString()} {post.likes === 1 ? 'like' : 'likes'}
                  </div>
                )}
              </div>
            </div>
          ))
          }
          
          {/* Invisible element to detect end of feed */}
          <div ref={feedEndRef} className="h-20 w-full" />
        </>
        )}
      </div>

      {/* ================= FLOATING ACTION BUTTON ================= */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleUpload}
        accept="image/*,video/*"
      />

      {/* Story Upload Input */}
      <input
        type="file"
        ref={storyInputRef}
        className="hidden"
        onChange={handleStoryUpload}
        accept="image/*,video/*"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 hover:opacity-90 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-40"
        style={{background: 'linear-gradient(to right, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'}}
        aria-label="Create new post"
      >
        <FaPlus className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* ================= STORY VIEWER MODAL ================= */}
      {isStoryViewerOpen && viewerStories.length > 0 && viewerStories[currentStoryIndex] && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.9)'}}
          onClick={closeStoryViewer}
        >
          <div 
            className="relative w-full h-full max-w-md mx-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 px-2 pt-2">
              <div className="flex gap-1">
                {viewerStories.map((_, index) => (
                  <div 
                    key={index}
                    className="h-1 flex-1 rounded-full overflow-hidden"
                    style={{backgroundColor: 'rgba(255, 255, 255, 0.3)'}}
                  >
                    <div
                      className="h-full bg-white transition-all duration-75 ease-linear"
                      style={{
                        width: index < currentStoryIndex 
                          ? '100%' 
                          : index === currentStoryIndex 
                            ? `${storyProgress}%` 
                            : '0%'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Header */}
            <div className="absolute top-12 left-0 right-0 z-10 px-4 py-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-3 pointer-events-auto">
                {viewerStories[currentStoryIndex].userDp ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shrink-0">
                    <img
                      src={viewerStories[currentStoryIndex].userDp}
                      alt={viewerStories[currentStoryIndex].userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white" style={{backgroundColor: '#FAFAFA'}}>
                    <FaUserCircle size={20} style={{color: '#8E8E8E'}} />
                  </div>
                )}
                <span className="font-semibold text-sm text-white">
                  {viewerStories[currentStoryIndex].userName?.toUpperCase()}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  closeStoryViewer()
                }}
                className="p-2 hover:opacity-70 transition-opacity pointer-events-auto z-50 relative"
                style={{cursor: 'pointer'}}
                aria-label="Close"
                type="button"
              >
                <FaTimes size={20} className="text-white" />
              </button>
            </div>

            {/* Story Content */}
            <div className="flex-1 flex items-center justify-center relative">
              {/* Navigation Buttons */}
              <button
                onClick={prevStory}
                className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
                aria-label="Previous story"
                disabled={currentStoryIndex === 0}
                style={{pointerEvents: currentStoryIndex === 0 ? 'none' : 'auto'}}
              />
              <button
                onClick={nextStory}
                className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
                aria-label="Next story"
                disabled={currentStoryIndex === viewerStories.length - 1}
                style={{pointerEvents: currentStoryIndex === viewerStories.length - 1 ? 'none' : 'auto'}}
              />

              {/* Media Display */}
              {viewerStories[currentStoryIndex].mediaType === "image" ? (
                <img
                  src={viewerStories[currentStoryIndex].mediaUrl}
                  alt="Story"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  ref={storyVideoRef}
                  src={viewerStories[currentStoryIndex].mediaUrl}
                  className="max-w-full max-h-full object-contain"
                  playsInline
                  autoPlay
                  muted={false}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= UPLOAD PROGRESS MODAL ================= */}
      {isUploadingPost && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.75)'}}
        >
          <div className="bg-white rounded-lg w-full max-w-sm mx-auto p-6">
            <h2 className="text-lg font-semibold mb-4 text-center" style={{color: '#262626'}}>
              Uploading Post...
            </h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(to right, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                }}
              />
            </div>
            <p className="text-center text-sm" style={{color: '#8E8E8E'}}>
              {uploadProgress}% complete
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
