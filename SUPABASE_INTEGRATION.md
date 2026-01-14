# Supabase Integration

## Setup Complete

The application has been configured to connect to Supabase. All data tables have been updated to fetch data from your Supabase database.

## Environment Variables

**IMPORTANT**: Create a `.env.local` file in the root directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cebhvmmicidqfusgwori.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6LAjxG6dK8GV5E_NSMQXyA_9r7vTiYb
SUPABASE_SERVICE_ROLE_KEY=sb_secret_jL40Ty8omqMan_qk8mz2og_U9gbA42W
```

## Database Tables Expected

The application expects the following table names in your Supabase database:

1. **trailer_orders** - For the Trailer Orders page
2. **dealers** - For the Dealers page
3. **shipping_companies** - For the Shipping Companies page
4. **vendors** - For the Vendors page
5. **build_schedule** - For the Build Schedule page
6. **ship_schedule** - For the Ship Schedule page
7. **inventory** - For the Inventory page
8. **pricing** - For the Pricing page
9. **models** - For the Settings/Models page

## Data Mapping

The application will automatically fetch data from these tables. If a table doesn't exist or returns an error, the application will fall back to placeholder data.

## Column Mapping

The TypeScript interfaces in `src/types/index.ts` define the expected data structure. Make sure your Supabase tables match these structures:

- **Order**: id, astNumber, poNumber, dealer, shipment, model, orderDate, finDate, optionsCount, hasCustomOptions, price
- **Dealer**: id, name, dealerContact, contact, active, city, zipCode, discount
- **ShippingCompany**: id, name, contact, phone, area, minDistance, notes, mail, state
- **Vendor**: id, name, contactData, address, zipCode
- **BuildSchedule**: id, startDate, orderAsset, frame, door, height, dealer, vin, status, buildNotes
- **Shipment**: id, shippingId, dealer, customer, vin, hasShipper, date
- **InventoryItem**: id, partType, label, pn, unit, min, available, onHand, reserved
- **PricingItem**: id, type, name, pn, subtype, maxAmount, unit, status, pricePerUnit, pricePerUnitBV
- **Model**: id, size, model, rearDoor, axleRating, axleType, tiresWheels, brightView

## Features Added

1. ✅ Supabase client configured (`src/lib/supabase/client.ts`)
2. ✅ Query helpers created (`src/lib/supabase/queries.ts`)
3. ✅ All table components updated to fetch from Supabase
4. ✅ Loading states added with Skeleton components
5. ✅ Error handling with fallback to placeholder data

## Next Steps

1. Create the `.env.local` file with your Supabase credentials
2. Ensure your Supabase tables match the expected schema
3. Test each page to verify data is loading correctly
4. Adjust column mappings in `src/lib/supabase/queries.ts` if your table structure differs

## Troubleshooting

If data is not loading:

1. Check browser console for errors
2. Verify `.env.local` file exists and has correct values
3. Check Supabase dashboard to ensure tables exist
4. Verify table names match exactly (case-sensitive)
5. Check RLS (Row Level Security) policies in Supabase

