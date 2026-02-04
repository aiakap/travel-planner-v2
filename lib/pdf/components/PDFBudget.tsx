/**
 * PDF Budget Component
 * 
 * Displays the trip budget summary with category breakdowns.
 * Mirrors the web budget view with dual currency display.
 */

import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { styles } from './styles'

/**
 * Budget category item with pre-calculated USD values
 */
interface BudgetCategoryItem {
  id: string
  title: string
  amountUSD: number
  amountLocal: number
  currency: string
  status: string
}

/**
 * Budget category with totals
 */
interface BudgetCategory {
  category: string
  total: number
  count: number
  items: BudgetCategoryItem[]
}

/**
 * Complete budget data for PDF rendering
 */
interface PDFBudgetData {
  bookedTotal: number
  categoryTotals: BudgetCategory[]
  tripDays: number
  tripNights: number
  dailyAverage: number
}

interface PDFBudgetProps {
  budget: PDFBudgetData
}

// Category icons (text-based for PDF)
const categoryIcons: Record<string, string> = {
  Transport: '✈️',
  Stay: '🏨',
  Eat: '🍽️',
  Do: '🎯',
  Other: '📦',
}

/**
 * Format amount as USD currency string
 */
function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format dual currency display (local + USD)
 */
function formatDualCurrency(amountLocal: number, currency: string, amountUSD: number): string {
  if (currency === 'USD' || !currency) {
    return formatUSD(amountUSD)
  }
  
  try {
    const localFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountLocal)
    
    return `${localFormatted} (${formatUSD(amountUSD)})`
  } catch {
    return `${amountLocal} ${currency} (${formatUSD(amountUSD)})`
  }
}

export function PDFBudget({ budget }: PDFBudgetProps) {
  if (!budget || budget.bookedTotal === 0) {
    return null
  }

  return (
    <View style={styles.budgetSection}>
      <Text style={styles.sectionHeader}>Budget Summary</Text>
      
      {/* Booked Budget Card */}
      <View style={styles.budgetCard}>
        <View style={styles.budgetCardHeader}>
          <Text style={styles.budgetCardTitle}>Booked Budget</Text>
          <Text style={styles.budgetCardSubtitle}>
            Confirmed & planned reservations
          </Text>
        </View>
        <View style={styles.budgetCardTotal}>
          <Text style={styles.budgetTotalAmount}>{formatUSD(budget.bookedTotal)}</Text>
          <Text style={styles.budgetTotalLabel}>
            {budget.categoryTotals.reduce((sum, c) => sum + c.count, 0)} items
          </Text>
        </View>
      </View>
      
      {/* Category Breakdown */}
      <View style={styles.budgetCategories}>
        {budget.categoryTotals.map((category) => {
          const percentage = budget.bookedTotal > 0 
            ? (category.total / budget.bookedTotal) * 100 
            : 0
          
          return (
            <View key={category.category} style={styles.budgetCategoryCard}>
              {/* Category Header */}
              <View style={styles.budgetCategoryHeader}>
                <View style={styles.budgetCategoryLeft}>
                  <Text style={styles.budgetCategoryIcon}>
                    {categoryIcons[category.category] || '📦'}
                  </Text>
                  <View>
                    <Text style={styles.budgetCategoryName}>{category.category}</Text>
                    <Text style={styles.budgetCategoryCount}>
                      {category.count} item{category.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.budgetCategoryRight}>
                  <Text style={styles.budgetCategoryTotal}>{formatUSD(category.total)}</Text>
                  <Text style={styles.budgetCategoryPercent}>{percentage.toFixed(1)}%</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.budgetProgressBar}>
                <View 
                  style={[
                    styles.budgetProgressFill,
                    { width: `${Math.min(percentage, 100)}%` }
                  ]} 
                />
              </View>
              
              {/* Category Items */}
              <View style={styles.budgetItemsList}>
                {category.items.map((item) => (
                  <View key={item.id} style={styles.budgetItem}>
                    <Text style={styles.budgetItemTitle}>{item.title}</Text>
                    <View style={styles.budgetItemRight}>
                      <Text style={styles.budgetItemAmount}>
                        {formatDualCurrency(item.amountLocal, item.currency, item.amountUSD)}
                      </Text>
                      <Text style={[
                        styles.budgetItemStatus,
                        item.status.toLowerCase().includes('confirm') 
                          ? styles.budgetStatusConfirmed 
                          : styles.budgetStatusPending
                      ]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )
        })}
      </View>
      
      {/* Total Summary Card */}
      <View style={styles.budgetTotalCard}>
        <View style={styles.budgetTotalCardHeader}>
          <Text style={styles.budgetTotalCardTitle}>Trip Total</Text>
          <Text style={styles.budgetTotalCardAmount}>{formatUSD(budget.bookedTotal)}</Text>
        </View>
        
        {/* Visual Breakdown Bar */}
        <View style={styles.budgetBreakdownBar}>
          {budget.categoryTotals.map((category, index) => {
            const percentage = budget.bookedTotal > 0 
              ? (category.total / budget.bookedTotal) * 100 
              : 0
            return (
              <View 
                key={category.category}
                style={[
                  styles.budgetBreakdownSegment,
                  { width: `${percentage}%` },
                  index === 0 && styles.budgetBreakdownFirst,
                  index === budget.categoryTotals.length - 1 && styles.budgetBreakdownLast,
                ]}
              />
            )
          })}
        </View>
        
        {/* Legend */}
        <View style={styles.budgetLegend}>
          {budget.categoryTotals.map((category) => {
            const percentage = budget.bookedTotal > 0 
              ? Math.round((category.total / budget.bookedTotal) * 100)
              : 0
            return (
              <View key={category.category} style={styles.budgetLegendItem}>
                <View style={styles.budgetLegendDot} />
                <Text style={styles.budgetLegendText}>
                  {category.category} ({percentage}%)
                </Text>
              </View>
            )
          })}
        </View>
        
        {/* Daily Average */}
        <View style={styles.budgetDailyAverage}>
          <Text style={styles.budgetDailyAverageLabel}>Daily average</Text>
          <Text style={styles.budgetDailyAverageAmount}>
            {formatUSD(budget.dailyAverage)}/day
          </Text>
        </View>
      </View>
    </View>
  )
}
