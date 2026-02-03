// AuthPage.jsx
import { useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate= useNavigate()

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post("http://localhost:5000/logIn", { email, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        // alert("Login successful!"); // Replace with redirect later
        navigate("/Home")
      } else {
        const res = await axios.post("http://localhost:5000/signup", { name, email, password });
        if (res.data.status === 200) {
          // alert("Signup successful! Please login.");
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - 3D Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 3D Illustration Image */}
            <img 
              src="/Gemini_Generated_Image_byvbolbyvbolbyvb.png" 
              alt="People Connecting Illustration" 
              className="w-full h-full object-contain"
              style={{
                animation: 'floatImage 6s ease-in-out infinite',
                filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1))'
              }}
            />
          </div>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 opacity-20 blur-2xl" style={{ animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 opacity-20 blur-2xl" style={{ animation: 'float 10s ease-in-out infinite reverse' }} />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-pink-200 to-yellow-200 opacity-15 blur-xl" style={{ animation: 'float 9s ease-in-out infinite' }} />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <img 
              src="/logo.png" 
              alt="ConnectUNI" 
              className="h-24 sm:h-32 md:h-40 w-auto object-contain"
            />
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-5 space-x-2">
            <button
              onClick={() => setIsLogin(true)}
              className={`px-8 py-2.5 font-semibold rounded-l-full transition-all duration-300 ${
                isLogin 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`px-8 py-2.5 font-semibold rounded-r-full transition-all duration-300 ${
                !isLogin 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {!isLogin && (
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="peer w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Full Name"
                  required
                />
                <label
                  htmlFor="name"
                  className="absolute left-4 -top-2.5 text-gray-500 text-sm font-medium bg-white px-1 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-purple-500"
                >
                  Full Name
                </label>
              </div>
            )}

            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Email Address"
                required
              />
              <label
                htmlFor="email"
                className="absolute left-4 -top-2.5 text-gray-500 text-sm font-medium bg-white px-1 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-purple-500"
              >
                Email Address
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Password"
                required
              />
              <label
                htmlFor="password"
                className="absolute left-4 -top-2.5 text-gray-500 text-sm font-medium bg-white px-1 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-purple-500"
              >
                Password
              </label>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
            >
              {loading ? "Processing..." : isLogin ? "Log In" : "Sign Up"}
            </button>
          </form>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes floatImage {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-15px) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
