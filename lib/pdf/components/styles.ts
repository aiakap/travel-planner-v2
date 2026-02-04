/**
 * PDF Stylesheet
 * 
 * Shared styles for PDF components using @react-pdf/renderer StyleSheet API
 * Enhanced with modern visual design and improved typography
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
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  
  // Header - Enhanced with better visual hierarchy
  header: {
    marginBottom: 24,
  },
  coverImage: {
    width: '100%',
    height: 180,
    objectFit: 'cover',
    marginBottom: 16,
    borderRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.6,
    marginTop: 10,
  },
  
  // Section Headers - Modern styling with accent color
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 14,
    color: '#1e40af',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 6,
    letterSpacing: 0.3,
  },
  subsectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 10,
    color: '#1e40af',
  },
  
  // Segments - Enhanced card styling with gradient-like effect
  segment: {
    marginBottom: 18,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  segmentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  segmentInfo: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 5,
  },
  
  // Reservations - Modern card design with subtle elevation
  reservation: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
  },
  reservationWithImage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reservationImage: {
    width: 72,
    height: 72,
    borderRadius: 6,
    marginRight: 14,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reservationDetailsWithImage: {
    flex: 1,
    maxWidth: '75%',
  },
  reservationHeader: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  reservationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  reservationType: {
    fontSize: 7,
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
  },
  reservationDetail: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 1.4,
    flexWrap: 'wrap',
  },
  reservationNotes: {
    fontSize: 8,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    lineHeight: 1.4,
  },
  
  // Intelligence Sections - Modern info cards
  intelligenceSection: {
    marginBottom: 18,
    padding: 14,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  intelligenceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#92400e',
    letterSpacing: 0.2,
  },
  intelligenceItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  intelligenceLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  intelligenceText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
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
  
  // Footer - Clean professional design
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
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
    width: 18,
    height: 18,
    marginRight: 6,
  },
  footerBrand: {
    fontSize: 9,
    color: '#1e40af',
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  footerCenter: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    width: '34%',
  },
  footerRight: {
    fontSize: 8,
    color: '#64748b',
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
  
  // Quick Reference Table - Modern table design
  table: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 26,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 26,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    backgroundColor: '#1e40af',
    minHeight: 30,
    alignItems: 'center',
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
    color: '#475569',
  },
  tableHeaderCell: {
    padding: 5,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.3,
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
  // Wider columns for table without address (redistributed widths)
  tableCellNameWide: {
    width: '20%',
  },
  tableCellVendorWide: {
    width: '14%',
  },
  tableCellConfWide: {
    width: '14%',
  },
  tableCellDateTimeWide: {
    width: '20%',
  },
  tableCellPriceWide: {
    width: '26%',
    textAlign: 'right',
  },
  tableTotalRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    minHeight: 32,
    alignItems: 'center',
    marginTop: 2,
  },
  tableTotalLabel: {
    padding: 6,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'right',
  },
  tableTotalValue: {
    padding: 6,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'right',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  
  // Language Guide styles
  languageCategory: {
    marginBottom: 10,
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
  languageGuideContainer: {
    marginBottom: 12,
  },
  languageGuideName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  phraseContainer: {
    marginBottom: 4,
  },
  verbsContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#fef3c7',
  },
  verbsTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  verbItem: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 2,
    paddingLeft: 8,
  },
  
  // Packing list enhanced styles
  listItemTip: {
    fontSize: 8,
    color: '#0369a1',
    marginBottom: 3,
    paddingLeft: 12,
    fontStyle: 'italic',
  },
  listItemNote: {
    fontSize: 8,
    color: '#7c3aed',
    marginBottom: 4,
    paddingLeft: 8,
    padding: 6,
    backgroundColor: '#f5f3ff',
    borderRadius: 4,
  },
  intelligenceTextSmall: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  
  // Trip Map Section
  mapSection: {
    marginBottom: 20,
  },
  tripMapImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginBottom: 12,
    objectFit: 'cover',
  },
  mapLegendContainer: {
    marginBottom: 12,
  },
  mapLegendTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  mapLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 6,
    width: '45%',
  },
  legendColorBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 6,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendSegmentTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  legendSegmentRoute: {
    fontSize: 7,
    color: '#64748b',
  },
  mapLocationsContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  mapLocationsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  mapLocationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mapLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '33%',
    marginBottom: 4,
  },
  mapLocationMarker: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#ef4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    textAlign: 'center',
    lineHeight: 14,
    marginRight: 4,
  },
  mapLocationName: {
    fontSize: 7,
    color: '#475569',
    flex: 1,
  },
  
  // Weather Section
  weatherSection: {
    marginBottom: 20,
  },
  weatherNote: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  weatherLocationCard: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  weatherLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherLocationName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  weatherForecastBadge: {
    fontSize: 7,
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  weatherEstimateBadge: {
    fontSize: 7,
    color: '#d97706',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  weatherForecastNote: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  weatherTable: {
    width: '100%',
  },
  weatherTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0284c7',
    borderRadius: 4,
    marginBottom: 4,
  },
  weatherTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
    paddingVertical: 4,
  },
  weatherTableCell: {
    padding: 4,
    fontSize: 8,
    color: '#0f172a',
  },
  weatherCellDate: {
    width: '20%',
  },
  weatherCellConditions: {
    width: '30%',
  },
  weatherCellTemp: {
    width: '20%',
    textAlign: 'center',
  },
  weatherCellDetails: {
    width: '30%',
  },
  weatherDetailText: {
    fontSize: 7,
    color: '#64748b',
  },
  weatherTimePeriods: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  weatherTimePeriodsTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 6,
  },
  weatherTimePeriodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherTimePeriod: {
    alignItems: 'center',
    padding: 4,
  },
  weatherTimePeriodLabel: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 2,
  },
  weatherTimePeriodTemp: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  
  // Segment Maps Section (at end of document)
  segmentMapsContainer: {
    marginBottom: 24,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  segmentMapsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  segmentMapsSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 12,
  },
  segmentMapImage: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    objectFit: 'cover',
  },
  
  // Transport Map Card
  transportMapCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  transportMapLegend: {
    padding: 12,
  },
  transportMapTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  transportMapRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transportMapPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  transportMapMarker: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#22c55e',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
    marginRight: 6,
  },
  transportMapMarkerEnd: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
    marginRight: 6,
  },
  transportMapLocation: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  transportMapTime: {
    fontSize: 8,
    color: '#64748b',
  },
  transportMapArrow: {
    fontSize: 14,
    color: '#94a3b8',
    marginHorizontal: 8,
  },
  transportMapConf: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  
  // Locations Map Card
  locationsMapCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  locationsMapLegend: {
    padding: 12,
  },
  locationsMapTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  locationsMapItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationsMapMarker: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
    marginRight: 8,
  },
  locationsMapDetails: {
    flex: 1,
  },
  locationsMapName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  locationsMapAddress: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 1,
  },
  locationsMapTime: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 1,
  },
  
  // Budget Section Styles
  budgetSection: {
    marginBottom: 24,
  },
  budgetCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetCardHeader: {
    flex: 1,
  },
  budgetCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
  },
  budgetCardSubtitle: {
    fontSize: 9,
    color: '#047857',
    marginTop: 2,
  },
  budgetCardTotal: {
    alignItems: 'flex-end',
  },
  budgetTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
  },
  budgetTotalLabel: {
    fontSize: 8,
    color: '#047857',
  },
  budgetCategories: {
    marginBottom: 12,
  },
  budgetCategoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  budgetCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetCategoryIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  budgetCategoryName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  budgetCategoryCount: {
    fontSize: 8,
    color: '#64748b',
  },
  budgetCategoryRight: {
    alignItems: 'flex-end',
  },
  budgetCategoryTotal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  budgetCategoryPercent: {
    fontSize: 8,
    color: '#64748b',
  },
  budgetProgressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  budgetProgressFill: {
    height: 6,
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  budgetItemsList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  budgetItemTitle: {
    fontSize: 8,
    color: '#0f172a',
    flex: 1,
  },
  budgetItemRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  budgetItemAmount: {
    fontSize: 8,
    color: '#475569',
  },
  budgetItemStatus: {
    fontSize: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  budgetStatusConfirmed: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  budgetStatusPending: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  budgetTotalCard: {
    backgroundColor: '#1e40af',
    borderRadius: 8,
    padding: 14,
  },
  budgetTotalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTotalCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  budgetTotalCardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  budgetBreakdownBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  budgetBreakdownSegment: {
    height: 8,
    backgroundColor: '#10b981',
  },
  budgetBreakdownFirst: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  budgetBreakdownLast: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  budgetLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  budgetLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  budgetLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  budgetLegendText: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.8)',
  },
  budgetDailyAverage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 10,
  },
  budgetDailyAverageLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
  },
  budgetDailyAverageAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
})
