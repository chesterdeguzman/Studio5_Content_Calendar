# Studio 5 Content Production + QA — Firebase Version

This package preserves the original Firebase Realtime Database integration and adds:
- Calendar-level Brand Bible / Notes per brand
- Organised Brand Bible sections with add/delete and optional Mandatory QC rules
- Dedicated SOP sidebar tab
- Multiple SOP PDF uploads per brand (stored as data URLs, 2 MB each, matching the existing app pattern)
- Multiple SOP links with notes
- Expanded mandatory strategy brief fields
- Editable per-content Internal QC list
- Automatic `Premium Music Vibes QC` for Reels
- Quality Gate: Creator Check -> Internal Review -> Nicole / Lead Approval -> Ready for Client
- Revision/rejection reasons
- Updated workflow/use-case diagram
- Brand Notes/SOP removed from Settings UI

## Firebase paths added
`sharedMonthlyContentCalendarV2/brandBibles/{brandKey}`
`sharedMonthlyContentCalendarV2/sopResources/{brandKey}`

New strategy/QC/gate fields are stored inside each existing calendar content item.
