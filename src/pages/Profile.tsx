import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, auth, storage } from '../config/firebase'
import Avatar from '../components/Avatar'
import './Profile.css'

function Profile() {
  const { currentUser } = useAuth()
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
      
      // Reload page to refresh auth context
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile. Please try again.' 
      })
    } finally {
      setSaving(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <p>Please sign in to view your profile.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Update your personal information</p>
      </div>

      <div className="profile-content">
        <form onSubmit={handleSubmit} className="profile-form">
          {message && (
            <div className={`message message-${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-section">
            <h2>Profile Photo</h2>
            <div className="photo-upload-section">
              <div className="photo-preview">
                <Avatar
                  photoURL={photoPreview}
                  displayName={formData.displayName}
                  firstName={formData.firstName}
                  lastName={formData.lastName}
                  size={120}
                />
              </div>
              <div className="photo-upload-controls">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="upload-photo-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
                {formData.photoURL && (
                  <button
                    type="button"
                    className="remove-photo-button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                  >
                    Remove Photo
                  </button>
                )}
                <p className="photo-upload-note">Max file size: 5MB. JPG, PNG, or GIF.</p>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Personal Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled
                  className="disabled-input"
                />
                <small className="input-note">Email cannot be changed</small>
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile

