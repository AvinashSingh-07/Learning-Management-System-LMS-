import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 16;

const validateEmail = (val) => EMAIL_REGEX.test(val.trim());
const validatePassword = (val) =>
  val.length >= PASSWORD_MIN && val.length <= PASSWORD_MAX;

const emailError = (val) => {
  if (!val) return '';
  if (!validateEmail(val)) return 'Enter a valid email address';
  return '';
};
const passwordError = (val) => {
  if (!val) return '';
  if (val.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  if (val.length > PASSWORD_MAX) return `Password cannot exceed ${PASSWORD_MAX} characters`;
  return '';
};

const AuthModal = () => {
  const { showLogin, setShowLogin, setToken, backendUrl } = useContext(AppContext);

  const [state, setState] = useState('Login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [touched, setTouched] = useState({ email: false, password: false });

  const touch = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const resetForm = () => {
    setName(''); setEmail(''); setPassword('');
    setTouched({ email: false, password: false });
    setShowPass(false);
  };

  const switchState = (next) => { setState(next); resetForm(); };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error('Enter a valid email address (e.g. you@example.com)');
      return;
    }
    if (!validatePassword(password)) {
      toast.error(`Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters`);
      return;
    }
    if (state === 'Sign Up' && !name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      if (state === 'Sign Up') {
        const { data } = await axios.post(
          `${backendUrl}/api/auth/register`,
          { name: name.trim(), email: email.trim(), password },
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (data.success) {
          toast.success('Registration successful! Welcome aboard 🎉');
          setToken(data.token);
          localStorage.setItem('token', data.token);
          setShowLogin(false);
          resetForm();
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(
          `${backendUrl}/api/auth/login`,
          { email: email.trim(), password },
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (data.success) {
          toast.success('Login successful!');
          setToken(data.token);
          localStorage.setItem('token', data.token);
          setShowLogin(false);
          resetForm();
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!showLogin) return null;

  const emailErr  = touched.email    ? emailError(email)       : '';
  const passErr   = touched.password ? passwordError(password) : '';
  const passStrength = password.length === 0 ? 0
    : password.length < 6  ? 1
    : password.length < 10 ? 2
    : 3;
  const strengthLabel = ['', 'Weak', 'Medium', 'Strong'][passStrength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500'][passStrength];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-xl shadow-2xl relative w-full max-w-sm">

        <button
          onClick={() => { setShowLogin(false); resetForm(); }}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-lg leading-none"
          aria-label="Close"
        >✕</button>

        <p className="text-sm text-blue-600 font-medium mb-1">Learn grid</p>
        <h2 className="text-2xl font-bold mb-5">{state === 'Login' ? 'Login' : 'Create Account'}</h2>

        <form onSubmit={onSubmitHandler} className="flex flex-col gap-4" noValidate>

          {state === 'Sign Up' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                required
                className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className={`w-full border p-2.5 rounded-lg outline-none focus:ring-2 text-sm transition
                ${emailErr
                  ? 'border-red-400 focus:ring-red-400/30'
                  : 'border-gray-300 focus:ring-blue-500/30'}`}
            />
            {emailErr && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span>⚠</span> {emailErr}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-600">Password *</label>
              <span className="text-xs text-gray-400">{PASSWORD_MIN}–{PASSWORD_MAX} characters</span>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => {

                  if (e.target.value.length <= PASSWORD_MAX) setPassword(e.target.value);
                }}
                onBlur={() => touch('password')}
                placeholder="Min 6, Max 16 characters"
                required
                autoComplete={state === 'Login' ? 'current-password' : 'new-password'}
                maxLength={PASSWORD_MAX}
                className={`w-full border p-2.5 pr-10 rounded-lg outline-none focus:ring-2 text-sm transition
                  ${passErr
                    ? 'border-red-400 focus:ring-red-400/30'
                    : 'border-gray-300 focus:ring-blue-500/30'}`}
              />

              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs select-none"
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            {passErr && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span>⚠</span> {passErr}
              </p>
            )}

            {state === 'Sign Up' && password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`flex-1 rounded-full transition-all duration-300
                        ${passStrength >= n ? strengthColor : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 font-medium
                  ${passStrength === 1 ? 'text-red-500'
                  : passStrength === 2 ? 'text-yellow-500'
                  : 'text-green-600'}`}>
                  {strengthLabel}
                </p>
              </div>
            )}

            {password.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                {password.length}/{PASSWORD_MAX}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg mt-1 hover:bg-blue-700 transition"
          >
            {state === 'Login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {state === 'Login' ? (
            <p className="text-gray-500">
              Don't have an account?{' '}
              <span onClick={() => switchState('Sign Up')} className="text-blue-600 cursor-pointer font-medium hover:underline">
                Sign Up
              </span>
            </p>
          ) : (
            <p className="text-gray-500">
              Already have an account?{' '}
              <span onClick={() => switchState('Login')} className="text-blue-600 cursor-pointer font-medium hover:underline">
                Login
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
