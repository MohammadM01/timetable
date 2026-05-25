import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../utils/api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await login(username, password);
      if (response.success) {
        navigate("/");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch {
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden p-4">
      <div className="absolute left-10 top-10 h-44 w-44 rounded-full bg-cyan-300/30 blur-3xl"></div>
      <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-orange-300/30 blur-3xl"></div>
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <p className="kicker">Scholara timetable</p>
          <h1 className="mt-4 text-6xl font-black leading-tight">
            The white-glass command center for <span className="gradient-title">perfect schedules.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-slate-600">
            Enforce teacher limits, recess breaks, block periods, subject totals, and no free class periods from one polished workspace.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3">
            {["Max 2 consecutive", "Daily/weekly caps", "No double booking", "No free periods"].map((item) => (
              <div key={item} className="rounded-3xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-black text-slate-700 shadow-lg shadow-slate-100/70 backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center">
          <div className="overflow-hidden rounded-[2rem] border border-white/75 bg-white/82 shadow-2xl shadow-cyan-100/70 backdrop-blur-2xl">
            <div className="px-8 pt-8 pb-6">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xl font-black text-white shadow-xl shadow-cyan-200">
                T
              </div>
              <h1 className="text-3xl font-black gradient-title mb-2">
                TimetableMaster
              </h1>
              <p className="text-sm font-semibold text-slate-500">Welcome back. Your constraint engine is ready.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter your username"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-rose-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full btn-primary flex items-center justify-center ${
                  isLoading ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>
          
          <div className="border-t border-white/70 bg-slate-50/70 px-8 py-4">
            <p className="text-center text-xs font-bold text-slate-500">
              Protected by industry standard encryption
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
