/**
 * PDF Stylesheet
 * 
 * Shared styles for PDF components using @react-pdf/renderer StyleSheet API
 */

import { StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts if needed (optional - defaults to Helvetica)
// Font.register({
//   family: 'Open Sans',
//   src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf',
// })

export const styles = StyleSheet.create({
  // Document & Page
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  
  // Header
  header: {
    marginBottom: 30,
  },
  coverImage: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    marginBottom: 15,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    color: '#4a4a4a',
    lineHeight: 1.5,
    marginTop: 8,
  },
  
  // Section Headers
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    color: '#2563eb',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 4,
  },
  subsectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#1e40af',
  },
  
  // Segments
  segment: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  segmentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1e293b',
  },
  segmentInfo: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  
  // Reservations
  reservation: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reservationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  reservationType: {
    fontSize: 8,
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  reservationDetail: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 3,
  },
  reservationNotes: {
    fontSize: 8,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  
  // Intelligence Sections
  intelligenceSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  intelligenceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400e',
  },
  intelligenceItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  intelligenceLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 3,
  },
  intelligenceText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
  },
  
  // Lists
  list: {
    marginTop: 6,
  },
  listItem: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 3,
    paddingLeft: 12,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '33%',
  },
  footerLogo: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  footerBrand: {
    fontSize: 8,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  footerCenter: {
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'center',
    width: '34%',
  },
  footerRight: {
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'right',
    width: '33%',
  },
  
  // Utility
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flexDirection: 'column',
  },
  spacer: {
    height: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginVertical: 8,
  },
  
  // Quick Reference Table
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 24,
    alignItems: 'center',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    backgroundColor: '#f1f5f9',
    minHeight: 28,
    alignItems: 'center',
  },
  tableCell: {
    padding: 4,
    fontSize: 7,
    color: '#475569',
  },
  tableHeaderCell: {
    padding: 4,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tableCellType: {
    width: '6%',
    textAlign: 'center',
  },
  tableCellName: {
    width: '16%',
  },
  tableCellVendor: {
    width: '12%',
  },
  tableCellConf: {
    width: '12%',
  },
  tableCellDateTime: {
    width: '18%',
  },
  tableCellAddress: {
    width: '26%',
  },
  tableCellPrice: {
    width: '10%',
    textAlign: 'right',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  
  // Language Guide styles
  languageCategory: {
    marginBottom: 8,
  },
  languageCategoryTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    backgroundColor: '#fef3c7',
    padding: 4,
    borderRadius: 2,
  },
  phraseRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 8,
  },
  phraseLocal: {
    fontSize: 8,
    color: '#1e293b',
    width: '45%',
    fontWeight: 'bold',
  },
  phraseEnglish: {
    fontSize: 8,
    color: '#64748b',
    width: '45%',
    fontStyle: 'italic',
  },
  phrasePronunciation: {
    fontSize: 7,
    color: '#94a3b8',
    paddingLeft: 8,
    marginBottom: 2,
  },
})
