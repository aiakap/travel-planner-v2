# Performance Monitoring - Quick Start Guide

## 🚀 Getting Started

The performance monitoring system is now fully implemented and ready to use!

## Step 1: Verify Configuration ✅

Environment variables have been added to `.env`:
```bash
PERFORMANCE_TRACKING_ENABLED=true
PERFORMANCE_SAMPLE_RATE=1.0
PERFORMANCE_LOG_QUERIES=true
NEXT_PUBLIC_PERFORMANCE_TRACKING_ENABLED=true
```

## Step 2: Restart Development Server

```bash
npm run dev
```

The server needs to restart to load the new environment variables.

## Step 3: Generate Traffic (2-4 hours)

Use the application normally to collect performance data:

1. **Visit the Dashboard** - Navigate to `/` (home page)
2. **View Trips** - Visit `/view1/[tripId]` for various trips
3. **Manage Trips** - Visit `/manage1` to see trip list
4. **Navigate Around** - Click through different pages

**Recommendation**: Use the app for 2-4 hours to collect meaningful data. The more varied your usage, the better the insights.

## Step 4: View Performance Dashboard

After collecting data, visit:

```
http://localhost:3000/admin/performance
```

## What You'll See

### 📊 Summary Cards
- Total requests tracked
- Number of unique pages
- Average load time across all pages

### 🐌 Slowest Pages Table
Shows all pages sorted by load time with:
- **Red** = Pages taking >2 seconds (needs optimization)
- **Yellow** = Pages taking 1-2 seconds (could be improved)
- **Green** = Pages taking <1 second (performing well)

Key metrics per page:
- Request count
- Average total load time
- Average server render time
- Average database query time
- Average external API time
- Number of database queries
- P95 and P99 percentiles

### 🔥 Database Query Hotspots
Top 20 most time-consuming database queries:
- Model and action (e.g., "Trip.findMany")
- Number of times executed
- Average duration per query
- Total time spent on this query

**Use this to identify**:
- N+1 query problems
- Missing database indexes
- Inefficient queries

### 📈 Performance Timeline
Hourly view of performance over time:
- Visual bars showing average load times
- Request counts per hour
- Helps identify patterns or degradation

## Step 5: Analyze & Optimize

Look for:

1. **Pages with high load times** (>2s)
   - Check database query count
   - Look for external API calls
   - Review query details

2. **Frequent slow queries**
   - Candidates for database indexes
   - Consider caching
   - Optimize query structure

3. **External API bottlenecks**
   - Batch API calls
   - Implement caching
   - Parallelize independent calls

## Common Findings (Expected)

Based on the codebase analysis, you'll likely see:

### Dashboard (`/`) - Expected Issues:
- **Multiple timezone API calls** in a loop
  - Fix: Batch or cache timezone lookups
- **Heavy trip query** with nested includes
  - Fix: Add pagination or optimize includes
- **Statistics calculated on every request**
  - Fix: Cache statistics

### View1 Page - Expected Issues:
- **Multiple parallel data fetches**
  - May be optimized already
- **Profile data aggregation**
  - Consider caching user profile

### Manage1 Page - Expected Issues:
- **Trip list with aggregations**
  - Add pagination for users with many trips

## Time Range Selector

Use the dropdown to view different time periods:
- Last 1 hour (for immediate testing)
- Last 6 hours (for active development)
- Last 24 hours (default, good overview)
- Last 3 days (trend analysis)
- Last 7 days (weekly patterns)

## Tips for Best Results

1. **Start with 100% sampling** (`PERFORMANCE_SAMPLE_RATE=1.0`)
   - Captures all requests during data collection
   - Can reduce to 10-20% in production

2. **Test different scenarios**
   - User with many trips vs few trips
   - Different page types
   - Various data loads

3. **Compare before/after**
   - Note current metrics
   - Implement optimizations
   - Measure improvement

4. **Regular monitoring**
   - Check dashboard weekly
   - Watch for performance degradation
   - Validate optimization impact

## Production Deployment

When deploying to production:

1. **Reduce sample rate** to avoid overhead:
   ```bash
   PERFORMANCE_SAMPLE_RATE=0.1  # Track 10% of requests
   ```

2. **Set up data cleanup** (run monthly):
   ```sql
   DELETE FROM "PerformanceLog" 
   WHERE timestamp < NOW() - INTERVAL '30 days';
   ```

3. **Monitor dashboard regularly**
   - Set up alerts for degradation
   - Review weekly performance trends

## Troubleshooting

### No data showing up?

1. **Check environment variables**:
   ```bash
   cat .env | grep PERFORMANCE
   ```

2. **Verify server restarted** after adding env vars

3. **Check browser console** for client-side errors

4. **Verify database connection** - logs should be created

### Dashboard shows empty?

- Wait longer - need at least a few page loads
- Check time range selector - try "Last 1 hour"
- Verify tracking is enabled in both server and client

### Performance seems slow?

- Tracking is designed to be non-blocking
- Check `PERFORMANCE_SAMPLE_RATE` - reduce if needed
- Verify async logging is working (check for errors)

## What's Next?

After collecting data:

1. **Identify top 3 bottlenecks** from dashboard
2. **Implement optimizations** (see full guide)
3. **Measure improvements** with before/after comparison
4. **Iterate** - optimize, measure, repeat

## Need More Details?

See the full implementation guide:
- `PERFORMANCE_MONITORING_IMPLEMENTATION_COMPLETE.md`

## Quick Reference

| Metric | What It Means | Good | Needs Work |
|--------|---------------|------|------------|
| Total Load Time | Complete page load | <1s | >2s |
| Server Render Time | Server processing | <500ms | >1s |
| DB Query Time | Database operations | <200ms | >500ms |
| External API Time | Third-party APIs | <300ms | >800ms |
| Query Count | Number of DB queries | <10 | >20 |

---

**Ready to start?** Restart your dev server and start using the app! 🎉
