import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { updateProfile as updateAuthProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, auth, storage } from '../config/firebase'
import Avatar from '../components/Avatar'

function Profile() {
  const { currentUser } = useAuth()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    displayName: '',
    photoURL: ''
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          setLoading(true)
          const [userDoc, clientDoc] = await Promise.all([
            getDoc(doc(db, 'users', currentUser.uid)),
            getDoc(doc(db, 'clients', currentUser.uid))
          ])
          
          let firstName = ''
          let lastName = ''
          let email = currentUser.email || ''
          let phone = ''
          
          // Get data from users collection
          if (userDoc.exists()) {
            const userData = userDoc.data()
            firstName = userData.firstName || ''
            lastName = userData.lastName || ''
            email = userData.email || email
            phone = userData.phone || phone
          } else {
            // Parse from displayName if user doc doesn't exist
            const displayName = currentUser.displayName || ''
            const nameParts = displayName.split(' ')
            firstName = nameParts[0] || ''
            lastName = nameParts.slice(1).join(' ') || ''
          }
          
          // Get phone from clients collection if not found in users
          if (!phone && clientDoc.exists()) {
            const clientData = clientDoc.data()
            phone = clientData.phone || ''
          }

          // Get photoURL from user doc or auth
          const photoURL = userDoc.exists() 
            ? userDoc.data().photoURL || currentUser.photoURL || ''
            : currentUser.photoURL || ''
          
          setFormData({
            firstName,
            lastName,
            email,
            phone,
            displayName: `${firstName} ${lastName}`.trim() || currentUser.displayName || '',
            photoURL
          })
          setPhotoPreview(photoURL)
        } catch (error) {
          console.error('Error loading user data:', error)
          setMessage({ type: 'error', text: 'Failed to load profile data' })
          // Set basic data from Auth
          setFormData({
            firstName: currentUser.displayName?.split(' ')[0] || '',
            lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
            email: currentUser.email || '',
            phone: '',
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || ''
          })
          setPhotoPreview(currentUser.photoURL || null)
        } finally {
          setLoading(false)
        }
      }
    }

    loadUserData()
  }, [currentUser])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' })
      return
    }

    try {
      setUploadingPhoto(true)
      setMessage(null)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Delete old photo if exists
      if (formData.photoURL) {
        try {
          const oldPhotoRef = ref(storage, formData.photoURL)
          await deleteObject(oldPhotoRef)
        } catch (error) {
          // Ignore errors if file doesn't exist
        }
      }

      // Upload new photo
      const photoRef = ref(storage, `profile-photos/${currentUser.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(photoRef, file)
      const downloadURL = await getDownloadURL(photoRef)

      // Update form data
      setFormData(prev => ({ ...prev, photoURL: downloadURL }))
      
      // Update Firebase Auth profile
      await updateAuthProfile(auth.currentUser!, {
        photoURL: downloadURL
      })

      // Update Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        photoURL: downloadURL
      }, { merge: true })

      setMessage({ type: 'success', text: 'Photo updated successfully!' })
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      setMessage({ type: 'error', text: 'Failed to upload photo. Please try again.' })
      setPhotoPreview(formData.photoURL)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!currentUser || !formData.photoURL) return

    try {
      setUploadingPhoto(true)
      setMessage(null)

      // Delete photo from Storage
      try {
        const photoRef = ref(storage, formData.photoURL)
        await deleteObject(photoRef)
      } catch (error) {
        // Ignore errors if file doesn't exist
      }

      // Update Firebase Auth profile
      await updateAuthProfile(auth.currentUser!, {
        photoURL: null
      })

      // Update Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        photoURL: null
      }, { merge: true })

      setFormData(prev => ({ ...prev, photoURL: '' }))
      setPhotoPreview(null)
      setMessage({ type: 'success', text: 'Photo removed successfully!' })
    } catch (error: any) {
      console.error('Error removing photo:', error)
      setMessage({ type: 'error', text: 'Failed to remove photo. Please try again.' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !auth.currentUser) return

    // Validation
    if (!passwordData.currentPassword) {
      showError('Please enter your current password')
      return
    }

    if (!passwordData.newPassword) {
      showError('Please enter a new password')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showError('New password must be at least 6 characters long')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match')
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      showError('New password must be different from current password')
      return
    }

    try {
      setChangingPassword(true)
      
      // Re-authenticate user (required for password change)
      if (!currentUser.email) {
        showError('Email not found. Cannot change password.')
        return
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      )
      
      await reauthenticateWithCredential(auth.currentUser, credential)

      // Update password
      await updatePassword(auth.currentUser, passwordData.newPassword)

      showSuccess('Password changed successfully!')
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordChange(false)
    } catch (error: any) {
      console.error('Error changing password:', error)
      
      let errorMessage = 'Failed to change password. Please try again.'
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak. Please choose a stronger password.'
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign back in before changing your password'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      showError(errorMessage)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      setSaving(true)
      setMessage(null)

      const displayName = `${formData.firstName} ${formData.lastName}`.trim()

      // Update Firebase Auth profile
      await updateAuthProfile(auth.currentUser!, {
        displayName: displayName || currentUser.email || ''
      })

      // Update Firestore users collection
      await setDoc(doc(db, 'users', currentUser.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || currentUser.email,
        phone: formData.phone,
        displayName: displayName,
        photoURL: formData.photoURL || null,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      // Also update clients collection (create if doesn't exist)
      await setDoc(doc(db, 'clients', currentUser.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || currentUser.email,
        phone: formData.phone,
        userId: currentUser.uid
      }, { merge: true })

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      showSuccess('Profile updated successfully!')
      
      // Reload page to refresh auth context
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      const errorMessage = error.message || 'Failed to update profile. Please try again.'
      setMessage({ type: 'error', text: errorMessage })
      showError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-gradient-to-b from-bg-light via-sky/10 to-nature-green/10">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-white via-sky/10 to-nature-green/10 p-12 md:p-8 rounded-2xl shadow-custom-lg border border-primary/20">
          <p className="text-text-dark text-center">Please sign in to view your profile.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-gradient-to-b from-bg-light via-sky/10 to-nature-green/10">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-white via-sky/10 to-nature-green/10 p-12 md:p-8 rounded-2xl shadow-custom-lg border border-primary/20">
          <p className="text-text-dark text-center">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 bg-bg-light">
      <div className="text-center mb-6 sm:mb-8 px-4">
        <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-2 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">My Profile</h1>
        <p className="text-base sm:text-lg text-text-light">Update your personal information</p>
      </div>

      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 lg:p-12 rounded-2xl shadow-custom-lg">
        <form onSubmit={handleSubmit} className="w-full">
          {message && (
            <div className={`p-4 rounded-lg mb-6 text-center font-medium ${
              message.type === 'success' 
                ? 'bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7]' 
                : 'bg-[#fce4ec] text-[#c2185b] border border-[#f8bbd0]'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-text-dark text-2xl sm:text-3xl lg:text-3xl mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-border">Profile Photo</h2>
            <div className="flex items-start gap-8 p-6 bg-gradient-to-r from-primary/10 via-sky/10 to-nature-green/10 rounded-xl border border-primary/20 md:flex-col md:items-center md:text-center">
              <div className="flex-shrink-0">
                <Avatar
                  photoURL={photoPreview}
                  displayName={formData.displayName}
                  firstName={formData.firstName}
                  lastName={formData.lastName}
                  size={120}
                />
              </div>
              <div className="flex-1 flex flex-col gap-4 md:w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="py-3 px-6 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 border-none bg-nature-gradient text-white hover:-translate-y-0.5 hover:shadow-custom disabled:opacity-60 disabled:cursor-not-allowed md:w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
                {formData.photoURL && (
                  <button
                    type="button"
                    className="py-3 px-6 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 border-none bg-[#e57373] text-white hover:bg-[#ef5350] hover:-translate-y-0.5 hover:shadow-custom disabled:opacity-60 disabled:cursor-not-allowed md:w-full"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                  >
                    Remove Photo
                  </button>
                )}
                <p className="text-sm text-text-light m-0">Max file size: 5MB. JPG, PNG, or GIF.</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-text-dark text-2xl sm:text-3xl lg:text-3xl mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-border">Personal Information</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-6 md:grid-cols-1">
              <div className="flex flex-col">
                <label htmlFor="firstName" className="font-semibold text-text-dark mb-2 text-sm">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="lastName" className="font-semibold text-text-dark mb-2 text-sm">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 md:grid-cols-1">
              <div className="flex flex-col">
                <label htmlFor="email" className="font-semibold text-text-dark mb-2 text-sm">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled
                  className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit bg-bg-light cursor-not-allowed opacity-70"
                />
                <small className="mt-2 text-sm text-text-light italic">Email cannot be changed</small>
              </div>
              <div className="flex flex-col">
                <label htmlFor="phone" className="font-semibold text-text-dark mb-2 text-sm">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-4 px-8 bg-nature-gradient text-white text-lg font-semibold rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom-lg disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t-2 border-border">
          <h2 className="text-text-dark text-2xl sm:text-3xl lg:text-3xl mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-border">Change Password</h2>
          {!showPasswordChange ? (
            <button
              type="button"
              className="py-3 px-6 bg-transparent text-primary border-2 border-primary rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 hover:bg-primary hover:text-white hover:-translate-y-0.5 hover:shadow-custom"
              onClick={() => setShowPasswordChange(true)}
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-6 p-6 bg-gradient-to-r from-primary/10 via-sky/10 to-nature-green/10 rounded-xl border border-primary/20">
              <div className="flex flex-col">
                <label htmlFor="currentPassword" className="font-semibold text-text-dark mb-2 text-sm">Current Password *</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  required
                  placeholder="Enter your current password"
                  className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="newPassword" className="font-semibold text-text-dark mb-2 text-sm">New Password *</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                  minLength={6}
                  placeholder="Enter new password (min. 6 characters)"
                  className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
                <small className="mt-2 text-sm text-text-light italic">Password must be at least 6 characters long</small>
              </div>

              <div className="flex flex-col">
                <label htmlFor="confirmPassword" className="font-semibold text-text-dark mb-2 text-sm">Confirm New Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                  className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
              </div>

              <div className="flex gap-4 mt-2 md:flex-col">
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 bg-nature-gradient text-white rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 border-none hover:-translate-y-0.5 hover:shadow-custom disabled:opacity-60 disabled:cursor-not-allowed md:w-full"
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Changing Password...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  className="py-3 px-6 bg-transparent text-text-light border-2 border-border rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 hover:border-text-light hover:text-text-dark disabled:opacity-60 disabled:cursor-not-allowed md:w-full"
                  onClick={() => {
                    setShowPasswordChange(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                  }}
                  disabled={changingPassword}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

