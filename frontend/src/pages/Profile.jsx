import axios from 'axios'
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUserCircle, FaTimes, FaTrash } from 'react-icons/fa'
import { API_URL } from '../config'

// Function to format numbers (e.g., 2400 -> 2.4K)
const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Function to capitalize name (first letter of each word)
const capitalizeName = (name) => {
  if (!name) return ''
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const Profile = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const dpInputRef = useRef(null)
  const [userName, setUserName] = useState("")
  const [userFullName, setUserFullName] = useState("")
  const [dp, setDp] = useState("")
  const [bio, setBio] = useState("")
  const [posts, setPosts] = useState([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [isDpModalOpen, setIsDpModalOpen] = useState(false)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPostIndex, setSelectedPostIndex] = useState(0)
  const [editName, setEditName] = useState("")
  const [editBio, setEditBio] = useState("")
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deletingPost, setDeletingPost] = useState(false)
  const [uploadingDp, setUploadingDp] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch user profile data and posts
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")

      try {
        // Get user info from localStorage
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setUserName(user.name || "")
          setUserFullName(user.name || "")
        }

        // Fetch profile data
        try {
          const profileRes = await axios.get(`${API_URL}/getProfile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (profileRes.data.profile) {
            const profile = profileRes.data.profile
            setUserName(profile.name || "")
            setUserFullName(profile.name || "")
            setDp(profile.dp || "")
            setBio(profile.bio || "")
          }
        } catch (err) {
          console.error("Error fetching profile:", err)
          // Fallback to DP endpoint if profile endpoint fails
          try {
            const dpRes = await axios.get(`${API_URL}/getDp`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            setDp(dpRes.data.dp || "")
          } catch (dpErr) {
            console.error("Error fetching DP:", dpErr)
          }
        }

        // Fetch user posts
        try {
          const postsRes = await axios.get(`${API_URL}/getMyPosts`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (postsRes.data.posts) {
            setPosts(postsRes.data.posts)
          }
        } catch (err) {
          console.error("Error fetching posts:", err)
        }

        // Generate random followers and following counts
        setFollowers(Math.floor(Math.random() * 5000) + 500) // Random between 500-5500
        setFollowing(Math.floor(Math.random() * 2000) + 200) // Random between 200-2200
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [])

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

    setIsUploading(true)
    setUploadProgress(0)

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
        // Add the new post directly with the real MongoDB ID
        const newPost = {
          _id: res.data.postId,
          url: res.data.url,
          type: file.type.startsWith("video") ? "video" : "image",
          createdAt: new Date()
        }
        setPosts(prev => [newPost, ...prev])
      }
    } catch (err) {
      console.error("Upload failed:", err)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }

    e.target.value = null
  }

  // Handle dp upload/change
  const handleDpUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Show immediate preview for better UX
    const previewUrl = URL.createObjectURL(file)
    setDp(previewUrl)
    setIsDpModalOpen(false)
    setUploadingDp(true)

    const formData = new FormData()
    formData.append("dp", file)

    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${API_URL}/uploadDp`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (res.data.status === 200) {
        setDp(res.data.url)
        URL.revokeObjectURL(previewUrl) // Clean up preview URL
      }
    } catch (err) {
      console.error("Error uploading dp:", err)
    } finally {
      setUploadingDp(false)
    }

    e.target.value = null
  }

  // Handle dp circle click
  const handleDpClick = () => {
    if (!dp) {
      // No dp exists - directly open file picker to set dp
      dpInputRef.current?.click()
    } else {
      // Dp exists - open modal to view (with option to change)
      setIsDpModalOpen(true)
    }
  }

  // Handle delete post
  const handleDeletePost = async () => {
    if (!posts[selectedPostIndex]) return
    
    setDeletingPost(true)
    try {
      const token = localStorage.getItem("token")
      const postId = posts[selectedPostIndex]._id
      
      const res = await axios.delete(
        `${API_URL}/deletePost/${postId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (res.data.status === 200) {
        // Remove the post from local state
        const updatedPosts = posts.filter((_, index) => index !== selectedPostIndex)
        setPosts(updatedPosts)
        setIsDeleteConfirmOpen(false)
        setIsMediaModalOpen(false)
        setSelectedPostIndex(0)
      }
    } catch (err) {
      console.error("Error deleting post:", err)
    } finally {
      setDeletingPost(false)
    }
  }

  // Handle opening edit profile modal
  const handleEditProfile = () => {
    setEditName(userFullName)
    setEditBio(bio)
    setIsEditModalOpen(true)
  }

  // Handle saving profile changes
  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.put(
        `${API_URL}/updateProfile`,
        {
          name: editName,
          bio: editBio
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (res.data.status === 200) {
        setUserFullName(editName)
        setUserName(editName)
        setBio(editBio)
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const user = JSON.parse(storedUser)
          user.name = editName
          localStorage.setItem("user", JSON.stringify(user))
        }
        
        setIsEditModalOpen(false)
      }
    } catch (err) {
      console.error("Error updating profile:", err)
    }
  }

  // Handle share profile
  const handleShareProfile = async () => {
    const profileUrl = window.location.href
    
    // Try using Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userFullName || 'User'}'s Profile`,
          text: `Check out ${userFullName || 'this user'}'s profile on CONNECTUNI`,
          url: profileUrl
        })
      } catch (err) {
        // User cancelled or error occurred, fallback to clipboard
        if (err.name !== 'AbortError') {
          copyToClipboard(profileUrl)
        }
      }
    } else {
      // Fallback to clipboard
      copyToClipboard(profileUrl)
    }
  }

  // Copy to clipboard helper function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (err) {
        console.error("Failed to copy link:", err)
      }
      document.body.removeChild(textArea)
    })
  }

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        if (isDpModalOpen) {
          setIsDpModalOpen(false)
        }
        if (isMediaModalOpen) {
          setIsMediaModalOpen(false)
        }
        if (isEditModalOpen) {
          setIsEditModalOpen(false)
        }
      } else if (isMediaModalOpen) {
        if (e.key === 'ArrowLeft' && selectedPostIndex > 0) {
          setSelectedPostIndex(selectedPostIndex - 1)
        } else if (e.key === 'ArrowRight' && selectedPostIndex < posts.length - 1) {
          setSelectedPostIndex(selectedPostIndex + 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isDpModalOpen, isMediaModalOpen, isEditModalOpen, selectedPostIndex, posts.length])

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FFFFFF'}}>
      {/* ================= HEADER ================= */}
      <div className="sticky top-0 left-0 right-0 z-50" style={{backgroundColor: '#FFFFFF', borderBottom: '1px solid #DBDBDB'}}>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="ConnectUNI" 
              className="h-8 sm:h-10 md:h-12 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/Home")}
            />
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 sm:p-1.5 md:p-2 rounded-full transition-colors"
              style={{color: '#262626'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Create post"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button
              onClick={() => navigate("/Home")}
              className="p-1 sm:p-1.5 md:p-2 rounded-full transition-colors"
              style={{color: '#262626'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Home"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ================= PROFILE HEADER ================= */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6">
        <div className="flex gap-4 sm:gap-6 md:gap-8 lg:gap-12">
          {/* Profile Picture */}
          <div className="shrink-0">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden cursor-pointer transition-transform hover:scale-105 relative group" 
              style={{border: '1px solid #DBDBDB'}}
              onClick={handleDpClick}
            >
              {dp ? (
                <img
                  src={dp}
                  alt="Profile"
                  className={`w-full h-full object-cover ${uploadingDp ? 'opacity-50' : ''}`}
                />
              ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{backgroundColor: '#FAFAFA'}}>
                    <FaUserCircle className="w-12 h-12 sm:w-14 sm:h-14" style={{color: '#8E8E8E'}} />
                  </div>
              )}
              {/* Loading spinner when uploading */}
              {uploadingDp && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {/* Overlay hint for adding/changing dp */}
              {!uploadingDp && (
                <div 
                  className="absolute inset-0 flex items-center justify-center rounded-full transition-all"
                  style={{backgroundColor: 'transparent'}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg 
                    className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            {/* Username and Action Buttons */}
            <div className="flex flex-col gap-2 sm:gap-3 mb-2 sm:mb-3">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-light truncate" style={{color: '#262626'}}>
                {userName ? userName.toUpperCase().replace(/\s+/g, '_') : 'USERNAME'}
              </h2>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={handleEditProfile}
                  className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs md:text-sm font-semibold rounded-md border whitespace-nowrap"
                  style={{color: '#262626', borderColor: '#DBDBDB', backgroundColor: '#FFFFFF'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAFAFA'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                  }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleShareProfile}
                  className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs md:text-sm font-semibold rounded-md border whitespace-nowrap"
                  style={{color: '#262626', borderColor: '#DBDBDB', backgroundColor: '#FFFFFF'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAFAFA'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                  }}
                >
                  Share Profile
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-3 sm:gap-4 md:gap-6 mb-2 sm:mb-3">
              <div>
                <span className="font-semibold text-sm sm:text-base" style={{color: '#262626'}}>{posts.length}</span>
                <span className="ml-1 text-xs sm:text-sm md:text-base" style={{color: '#262626'}}>posts</span>
              </div>
              <div>
                <span className="font-semibold text-sm sm:text-base" style={{color: '#262626'}}>{formatNumber(followers)}</span>
                <span className="ml-1 text-xs sm:text-sm md:text-base" style={{color: '#262626'}}>followers</span>
              </div>
              <div>
                <span className="font-semibold text-sm sm:text-base" style={{color: '#262626'}}>{formatNumber(following)}</span>
                <span className="ml-1 text-xs sm:text-sm md:text-base" style={{color: '#262626'}}>following</span>
              </div>
            </div>

            {/* Full Name */}
            <div className="mb-1 sm:mb-2">
              <span className="font-semibold text-sm sm:text-base" style={{color: '#262626'}}>{capitalizeName(userFullName)}</span>
            </div>

            {/* Bio */}
            <div className="text-xs sm:text-sm" style={{color: '#262626'}}>
              {bio ? (
                <p style={{whiteSpace: 'pre-line'}}>{bio}</p>
              ) : (
                <>
                  <p>Computer Science '25 🎓</p>
                  <p>Coffee enthusiast ☕ | Book lover 📚</p>
                  <p>Capturing campus moments 📸</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENT TABS ================= */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 border-t" style={{borderColor: '#DBDBDB'}}>
        <div className="flex justify-center">
          <button className="py-2 sm:py-3 md:py-4 border-t-2" style={{borderColor: '#262626'}}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#262626'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ================= POSTS GRID ================= */}
      <div className="max-w-4xl mx-auto pb-4 sm:pb-6">
        {posts.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <p className="text-sm sm:text-base md:text-lg" style={{color: '#8E8E8E'}}>No posts yet. Share your first post!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-px sm:gap-[2px]">
            {posts.map((post, index) => (
              <div
                key={index}
                className="aspect-square overflow-hidden bg-black cursor-pointer relative group"
                onClick={() => {
                  setSelectedPostIndex(index)
                  setIsMediaModalOpen(true)
                }}
              >
                {post.type === "image" ? (
                  <img
                    src={post.url}
                    alt={`Post ${index + 1}`}
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={post.url}
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                      muted
                    />
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= HIDDEN FILE INPUT FOR POSTS ================= */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleUpload}
        accept="image/*,video/*"
      />

      {/* ================= HIDDEN FILE INPUT FOR DP ================= */}
      <input
        type="file"
        ref={dpInputRef}
        className="hidden"
        onChange={handleDpUpload}
        accept="image/*"
      />

      {/* ================= PROFILE PICTURE MODAL ================= */}
      {isDpModalOpen && dp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.85)'}}
          onClick={() => setIsDpModalOpen(false)}
        >
          <div 
            className="relative flex flex-col items-center justify-center gap-4 sm:gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsDpModalOpen(false)
              }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-800 transition-colors z-10"
              aria-label="Close"
              style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
            >
              <FaTimes className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            {/* Profile Picture - Large circular display */}
            <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden border-2 sm:border-4 border-white shadow-2xl">
              <img
                src={dp}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Change Photo Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                dpInputRef.current?.click()
              }}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold text-white transition-colors flex items-center gap-2 text-sm sm:text-base"
              style={{backgroundColor: '#0095F6'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0085E5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0095F6'
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Change Photo
            </button>
          </div>
        </div>
      )}

      {/* ================= MEDIA VIEWER MODAL ================= */}
      {isMediaModalOpen && posts.length > 0 && posts[selectedPostIndex] && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.9)'}}
          onClick={() => setIsMediaModalOpen(false)}
        >
          <div 
            className="relative w-full h-full max-w-4xl mx-auto flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsMediaModalOpen(false)
              }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-800 transition-colors z-10"
              aria-label="Close"
              style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
            >
              <FaTimes className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsDeleteConfirmOpen(true)
              }}
              className="absolute top-2 right-12 sm:top-4 sm:right-16 p-1.5 sm:p-2 rounded-full hover:bg-red-600 transition-colors z-10"
              aria-label="Delete post"
              title="Delete post"
              style={{backgroundColor: 'rgba(220, 38, 38, 0.8)'}}
            >
              <FaTrash className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            {/* Previous Button */}
            {selectedPostIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPostIndex(selectedPostIndex - 1)
                }}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 p-2 sm:p-3 rounded-full hover:bg-gray-800 transition-colors z-10"
                style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                aria-label="Previous"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next Button */}
            {selectedPostIndex < posts.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPostIndex(selectedPostIndex + 1)
                }}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 p-2 sm:p-3 rounded-full hover:bg-gray-800 transition-colors z-10"
                style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                aria-label="Next"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Media Display */}
            <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
              {posts[selectedPostIndex].type === "image" ? (
                <img
                  src={posts[selectedPostIndex].url}
                  alt={`Post ${selectedPostIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={posts[selectedPostIndex].url}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                />
              )}
            </div>

            {/* Post Counter */}
            {posts.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full"
                style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
              >
                <span className="text-white text-xs sm:text-sm">
                  {selectedPostIndex + 1} / {posts.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= EDIT PROFILE MODAL ================= */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.75)'}}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-md mx-auto p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold" style={{color: '#262626'}}>Edit Profile</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" style={{color: '#262626'}} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2" style={{color: '#262626'}}>
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{borderColor: '#DBDBDB', color: '#262626'}}
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2" style={{color: '#262626'}}>
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={{borderColor: '#DBDBDB', color: '#262626', minHeight: '100px'}}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-md font-semibold transition-colors"
                style={{color: '#262626', borderColor: '#DBDBDB', backgroundColor: '#FFFFFF'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FAFAFA'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md font-semibold text-white transition-colors"
                style={{backgroundColor: '#0095F6'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0085E5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0095F6'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {isDeleteConfirmOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.75)'}}
          onClick={() => setIsDeleteConfirmOpen(false)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-sm mx-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 text-center border-b" style={{borderColor: '#DBDBDB'}}>
              <h2 className="text-lg sm:text-xl font-semibold mb-2" style={{color: '#262626'}}>Delete Post?</h2>
              <p className="text-xs sm:text-sm" style={{color: '#8E8E8E'}}>
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <button
              onClick={handleDeletePost}
              disabled={deletingPost}
              className="w-full py-2.5 sm:py-3 text-sm sm:text-base text-red-500 font-semibold border-b hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{borderColor: '#DBDBDB'}}
            >
              {deletingPost ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-gray-50 transition-colors"
              style={{color: '#262626'}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= UPLOAD PROGRESS MODAL ================= */}
      {isUploading && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.75)'}}
        >
          <div className="bg-white rounded-lg w-full max-w-sm mx-auto p-6">
            <h2 className="text-lg font-semibold mb-4 text-center" style={{color: '#262626'}}>
              Uploading...
            </h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${uploadProgress}%`,
                  backgroundColor: '#0095F6'
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

export default Profile
