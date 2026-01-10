import { useState } from 'react'
import './Avatar.css'

interface AvatarProps {
  photoURL?: string | null
  displayName?: string | null
  firstName?: string
  lastName?: string
  size?: number
  className?: string
}

function Avatar({ photoURL, displayName, firstName, lastName, size = 40, className = '' }: AvatarProps) {
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    if (displayName) {
      const parts = displayName.trim().split(' ')
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
      }
      return parts[0].charAt(0).toUpperCase()
    }
    return 'U'
  }

  const getBackgroundColor = () => {
    const name = (firstName && lastName) ? `${firstName}${lastName}` : (displayName || 'User')
    const colors = [
      '#4A90E2', '#50C878', '#FF6B6B', '#FFA500', '#9B59B6',
      '#1ABC9C', '#E74C3C', '#3498DB', '#E67E22', '#F39C12'
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const [imageError, setImageError] = useState(false)

  if (photoURL && !imageError) {
    return (
      <img
        src={photoURL}
        alt={displayName || 'User'}
        className={`avatar ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImageError(true)}
      />
    )
  }

  return (
    <div
      className={`avatar avatar-initials ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: getBackgroundColor()
      }}
    >
      {getInitials()}
    </div>
  )
}

export default Avatar

