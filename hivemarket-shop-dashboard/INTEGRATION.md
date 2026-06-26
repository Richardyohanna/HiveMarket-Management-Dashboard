# HiveMarket — Shop Management Dashboard (integration guide)

These files are built to drop straight into your existing Expo app under
`Frontend/`. They reuse your `@/` alias, brand colors (`#008100`), Zustand
pattern, `fetch` + Bearer-token API style, `expo-image-picker`, and
`expo-location`. A shop is modelled as a **separate entity** with its own
session token (`shop_auth_token`), independent of the buyer/`auth_token`.

## 1. Copy files into your repo

Merge this folder into `Frontend/` keeping the same paths:

```
Frontend/
  app/
    Shop/
      RegisterShopScreen.tsx
      ShopLoginScreen.tsx
      components/ui.tsx
    (shop)/
      _layout.tsx
      DashboardScreen.tsx
      ProductsScreen.tsx
      ProductFormScreen.tsx
      MessagesScreen.tsx
      ShopProfileScreen.tsx
  src/
    types/shop.ts
    api/shopApi.ts
    services/shopAuthStorage.ts
    store/shopStore.ts
```

No new dependencies are required — everything is already in your
`package.json` (zustand, async-storage, expo-image-picker, expo-location,
expo-router).

## 2. Entry points

- **New shop:** navigate to `/Shop/RegisterShopScreen`
- **Existing shop:** navigate to `/Shop/ShopLoginScreen`
- After auth, both `router.replace("/(shop)/DashboardScreen")`.

To add a "Shop owner" choice in your existing `app/CreateAccount/RoleScreen.tsx`,
add a third role whose `onNext` routes to `/Shop/RegisterShopScreen` instead of
the gender/profile flow.

To route a shop owner straight to the dashboard on app launch, check for a
stored shop session early (e.g. in your root layout or splash):

```ts
import { getShopToken } from "@/src/services/shopAuthStorage";
// if (await getShopToken()) router.replace("/(shop)/DashboardScreen");
```

## 3. Registration payload

`RegisterShopScreen` calls `registerShopApi` with exactly the shape you
provided:

```ts
const shopResponse = await registerShopApi({
  name: shopName,
  password,
  ownerName: full_name,
  phone: phoneNumber,
  email,
  location: { address, latitude, longitude },
  image: profileImage,
});
```

It is sent as `multipart/form-data` (so the logo uploads in the same call).

## 4. Backend routes expected (Spring)

All under your `localURL`. Adjust field names to match your entities.

| Method | Route | Purpose |
| ------ | ----- | ------- |
| POST | `/api/shops/register` | multipart: name, password, ownerName, phone, email, address, latitude, longitude, image → `{ token, shop }` |
| POST | `/api/shops/login` | `{ email, password }` → `{ token, shop }` |
| GET  | `/api/shops/{shopId}` | shop details |
| PUT  | `/api/shops/{shopId}` | multipart update (auth) |
| GET  | `/api/shops/{shopId}/stats` | `{ followers, totalProducts, totalViews, totalSales, revenue, reactions }` |
| GET  | `/api/shops/{shopId}/followers` | `[{ id, full_name, profile_picture, university }]` or `{ followers: [...] }` |
| GET  | `/api/shops/{shopId}/conversations` | `[{ id, userId, name, avatar, lastMessage, time, unread }]` |

Products reuse your existing `/api/products` endpoints:

| Method | Route | Purpose |
| ------ | ----- | ------- |
| POST | `/api/products` | create (body now includes `shopId`) |
| PUT  | `/api/products/{id}` | update / edit (new — add to your controller) |
| POST | `/api/products/{id}/images` | image upload (existing) |
| DELETE | `/api/products?id={id}` | delete (existing) |
| GET | `/api/products/shop/all?userId=&shopId=` | shop products (existing, used by `useShopStore`) |

The only genuinely new product route is **`PUT /api/products/{id}`** for editing.
Everything else maps onto endpoints you already have.

## 5. Notes

- `ShopResponse.imageUrl` should be a full URL returned by your backend after
  upload; the screens render it directly with `<Image source={{ uri }} />`.
- `getShopFollowersApi` accepts either a bare array or `{ followers: [] }`.
- Currency is displayed as `ETB`; change the `money()` helper in
  `DashboardScreen.tsx` / the price labels if you use a different currency.
