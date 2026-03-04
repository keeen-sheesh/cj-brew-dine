# Fix Kitchen Order Sound Notification

## Task
Fix the sound notification when new orders arrive in the Kitchen Dashboard

## Issue Identified
- The polling logic compares total order count (`newOrderCount > lastOrderCount`), which only works when there are MORE orders
- It doesn't detect new orders that replace old ones or when page is freshly loaded
- The `lastOrderCount` is initialized with current orders length, so it never triggers properly

## Solution
1. Track seen order IDs to detect genuinely NEW orders
2. Use the `has_new_orders` flag from the API response properly
3. Ensure sound plays only for truly new orders

## Steps
- [ ] Add a ref to track seen order IDs in Kitchen.jsx
- [ ] Update pollForUpdates to detect new order IDs
- [ ] Use the `has_new_orders` flag from API response
- [ ] Play alarm only when genuinely new orders arrive
