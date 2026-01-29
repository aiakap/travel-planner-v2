/**
 * PDF Header Component
 * 
 * Displays trip title, dates, description, and cover image
 */

import React from 'react'
import { View, Text, Image } from '@react-pdf/renderer'
import { styles } from './styles'
import { format } from 'date-fns'

interface PDFHeaderProps {
  title: string
  description: string
  startDate: string
  endDate: string
  coverImage?: string
  dayCount: number
}

export function PDFHeader({
  title,
  description,
  startDate,
  endDate,
  coverImage,
  dayCount,
}: PDFHeaderProps) {
  const formattedStartDate = format(new Date(startDate), 'MMM d, yyyy')
  const formattedEndDate = format(new Date(endDate), 'MMM d, yyyy')
  
  return (
    <View style={styles.header}>
      {coverImage && (
        <Image
          src={coverImage}
          style={styles.coverImage}
        />
      )}
      
      <Text style={styles.title}>{title}</Text>
      
      <Text style={styles.subtitle}>
        {formattedStartDate} - {formattedEndDate} • {dayCount} {dayCount === 1 ? 'day' : 'days'}
      </Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  )
}
