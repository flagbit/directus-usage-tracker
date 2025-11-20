# Feature Specification: Directus Usage Analytics Module

**Feature Branch**: `001-usage-analytics-module`
**Created**: 2025-01-20
**Status**: Draft
**Input**: User description: "Ich möchte gerne ein Directus-Modul bauen, das mir die Usage der einzelnen Collections anzeigt..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Collection Storage Analysis (Priority: P1)

As a Directus administrator, I want to see the data volume in all my collections (including system/hidden collections) so that I can identify collections consuming excessive storage and optimize my database.

**Why this priority**: Understanding storage consumption is fundamental for database optimization and cost management. This is the core value proposition of the module.

**Independent Test**: Can be fully tested by querying collection metadata and displaying results in a chart. Delivers immediate value by showing which tables are largest.

**Acceptance Scenarios**:

1. **Given** I am logged into Directus as an admin, **When** I open the Usage Analytics module, **Then** I see a dashboard showing all collections with their row counts
2. **Given** the dashboard is loaded, **When** I view the collection list, **Then** I see both visible and hidden/system collections included
3. **Given** collections are displayed, **When** I look at the visualization, **Then** I see a bar chart or similar diagram showing data volumes
4. **Given** many collections exist, **When** I apply the Top 10 filter, **Then** only the 10 collections with most data are displayed

---

### User Story 2 - API Request Activity Analysis (Priority: P2)

As a Directus administrator, I want to analyze API request patterns from the activities log so that I can identify which endpoints or collections are generating excessive traffic and optimize them.

**Why this priority**: After understanding storage, analyzing traffic patterns helps optimize performance and identify potential issues or inefficiencies.

**Independent Test**: Can be tested by querying directus_activity table and aggregating by collection. Delivers value by showing API usage hotspots.

**Acceptance Scenarios**:

1. **Given** I am viewing the Usage Analytics module, **When** I switch to the API Activity tab, **Then** I see aggregated statistics about API requests
2. **Given** API activity data is loaded, **When** I view the statistics, **Then** I see request counts grouped by collection/endpoint
3. **Given** the API activity view is open, **When** I apply filters, **Then** I can see Top 10 most-requested collections
4. **Given** multiple users/integrations access the API, **When** I filter by IP address, **Then** I see request patterns for specific IP addresses

---

### User Story 3 - IP-Based Traffic Analysis (Priority: P3)

As a Directus administrator, I want to filter API activity by IP address so that I can identify which clients or integrations are generating the most requests and investigate potential issues or optimize specific integrations.

**Why this priority**: This adds granular analysis capabilities after basic storage and traffic patterns are established. Useful for debugging specific integration issues.

**Independent Test**: Can be tested by filtering directus_activity by IP and aggregating results. Delivers value by enabling client-specific troubleshooting.

**Acceptance Scenarios**:

1. **Given** I am viewing API activity data, **When** I select an IP address filter, **Then** I see only requests from that IP
2. **Given** an IP filter is active, **When** I view the collection breakdown, **Then** I see which collections that specific IP accesses most
3. **Given** IP-filtered data is displayed, **When** I view a chart, **Then** I see request volume trends for that IP
4. **Given** multiple IPs are of interest, **When** I compare them, **Then** I can see relative request volumes between IPs

---

### Edge Cases

- What happens when a collection has zero rows (newly created)?
- How does the module handle very large collections (millions of rows)?
- What happens if directus_activity table is empty or disabled?
- How are API requests from anonymous users (no IP) handled?
- What happens when collection metadata can't be retrieved (permissions issue)?
- How are deleted/archived collections shown in historical activity data?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST retrieve metadata for ALL collections, including system/hidden collections (directus_*, system tables)
- **FR-002**: System MUST query row counts from actual database tables for accuracy
- **FR-003**: System MUST display collection usage data as visual charts (bar chart, pie chart, or similar)
- **FR-004**: System MUST provide a "Top 10" filter to show only the 10 collections with most data
- **FR-005**: System MUST query directus_activity table to aggregate API request statistics
- **FR-006**: System MUST allow filtering API activity by collection name
- **FR-007**: System MUST allow filtering API activity by IP address
- **FR-008**: System MUST display API activity statistics as visual charts
- **FR-009**: System MUST handle large datasets efficiently (pagination, aggregation)
- **FR-010**: System MUST show real-time or near-real-time data (< 5 minute cache)
- **FR-011**: Module MUST integrate as a Directus extension (module type)
- **FR-012**: Module MUST respect Directus admin permissions (only accessible to admins)
- **FR-013**: System MUST provide export functionality for data (CSV or JSON)

### Key Entities *(include if feature involves data)*

- **Collection Metadata**: Collection name, table name, row count, is_system_collection flag, last_updated timestamp
- **Activity Record**: User ID, IP address, collection name, action type (create/read/update/delete), timestamp, request URL
- **Usage Statistics**: Collection name, row count, request count, unique IP count, date range, aggregation type

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can identify the Top 10 largest collections within 30 seconds of opening the module
- **SC-002**: Module displays collection data for 100+ collections without performance degradation (<2s load time)
- **SC-003**: API activity analysis correctly aggregates requests across all collections with <5% error margin
- **SC-004**: IP-based filtering returns results in <3 seconds for activity logs with 100,000+ entries
- **SC-005**: Charts and visualizations render within 1 second after data is loaded
- **SC-006**: 90% of administrators can use the module without documentation (intuitive UI)
- **SC-007**: Module reduces time to identify storage/traffic issues by 80% compared to manual SQL queries
