import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Footer from '../../components/student/Footer'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const Checkout = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const {
    backendUrl,
    currency,
    userData,
    getToken,
    fetchUserEnrolledCourses,
    calculateCourseDuration,
    setShowLogin,
  } = useContext(AppContext)

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [country] = useState('India')

  useEffect(() => {
    if (userData?.name) {
      setFullName((prev) => prev || userData.name)
    }
  }, [userData])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/course/${courseId}`)
        if (data.success && data.courseData) {
          setCourse(data.courseData)
        } else {
          toast.error(data.message || 'Course not found')
        }
      } catch (e) {
        toast.error(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [backendUrl, courseId])

  const validatePhone = (p) => {
    const cleaned = p.replace(/[\s\-()]/g, '')
    return /^(\+91)?[6-9]\d{9}$/.test(cleaned)
  }

  const validatePincode = (p) => /^[1-9][0-9]{5}$/.test(p.trim())

  const discountedPrice =
    course != null
      ? (course.coursePrice - (course.discount * course.coursePrice) / 100).toFixed(2)
      : '0.00'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userData) {
      toast.warn('Please log in to enroll.')
      return
    }
    if (!validatePhone(phone)) {
      toast.error('Enter a valid Indian mobile number (10 digits, e.g. 98765 43210)')
      return
    }
    if (!validatePincode(pincode)) {
      toast.error('Enter a valid 6-digit PIN code')
      return
    }
    if (!state) {
      toast.error('Please select your state')
      return
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${backendUrl}/api/user/enroll-free`,
        {
          courseId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          city: city.trim(),
          country,

          state: state.trim(),
          pincode: pincode.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        toast.success(data.message)
        await fetchUserEnrolledCourses()
        navigate('/my-enrollments')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 mb-4">We could not load this course.</p>
        <Link to="/" className="text-blue-600 underline">Back to home</Link>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-cyan-100/70 to-white pb-16">
        <div className="max-w-3xl mx-auto px-4 pt-10 md:pt-16">
          <p className="text-sm text-gray-500 mb-2">
            <Link to={`/course/${courseId}`} className="text-blue-600 hover:underline">
              ← Back to course
            </Link>
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">Checkout</h1>
          <p className="text-gray-500 mt-1">Complete your details to enroll — no payment required.</p>

          <div className="mt-8 flex flex-col md:flex-row gap-8">

            <div className="md:w-1/3 shrink-0">
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                <img src={course.courseThumbnail} alt="" className="w-full aspect-video object-cover" />
                <div className="p-4">
                  <h2 className="font-semibold text-gray-800 line-clamp-2">{course.courseTitle}</h2>
                  <p className="text-sm text-gray-500 mt-2">{calculateCourseDuration(course)} total</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-semibold text-gray-800">
                      {currency}{discountedPrice}
                    </span>
                    {Number(course.discount) > 0 && (
                      <>
                        <span className="text-sm text-gray-400 line-through">
                          {currency}{course.coursePrice}
                        </span>
                        <span className="text-xs text-green-600 font-medium">{course.discount}% off</span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-2">*Prices inclusive of GST where applicable</p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {!userData ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
                  <p className="font-medium">Sign in to enroll</p>
                  <p className="text-sm text-amber-900/90 mt-1">
                    Create an account or log in, then return to this page to complete checkout.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowLogin(true)}
                    className="mt-4 px-5 py-2.5 rounded-lg bg-amber-800 text-white text-sm font-medium hover:bg-amber-900"
                  >
                    Log in or sign up
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="font-medium text-gray-800 mb-4">Contact &amp; Billing Details</h3>
                    <div className="grid sm:grid-cols-2 gap-4">

                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Full name *</label>
                        <input
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input
                          readOnly
                          value={userData.email || ''}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <label className="block text-sm text-gray-600 mb-1">Mobile number *</label>
                        <div className="flex overflow-hidden rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500/30">
                          <span className="inline-flex items-center px-3 border-r border-gray-300 bg-gray-50 text-gray-600 text-sm select-none shrink-0">
                            🇮🇳 +91
                          </span>
                          <input
                            required
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            maxLength={10}
                            placeholder="98765 43210"
                            className="flex-1 min-w-0 px-3 py-2 outline-none bg-white"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">10-digit mobile number (starts with 6–9)</p>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Address line 1 *</label>
                        <input
                          required
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          placeholder="House/Flat no., Street, Area"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">City / District *</label>
                        <input
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Mumbai"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">PIN Code *</label>
                        <input
                          required
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="e.g. 400001"
                          maxLength={6}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">State / UT *</label>
                        <select
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Country</label>
                        <input
                          readOnly
                          value="India 🇮🇳"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
                        />
                      </div>

                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="font-medium text-gray-800 mb-3">Payment</h3>
                    <div className="rounded-lg border-2 border-green-200 bg-green-50/80 px-4 py-3 flex items-start gap-3">
                      <span className="text-green-600 text-xl leading-none">✓</span>
                      <div>
                        <p className="font-medium text-gray-800">Free enrollment</p>
                        <p className="text-sm text-gray-600 mt-1">
                          No card or payment is required. Your order total is {currency}0.00 after institutional access.
                        </p>
                      </div>
                    </div>
                  </section>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition"
                  >
                    {submitting ? 'Completing…' : 'Complete free enrollment'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Checkout
