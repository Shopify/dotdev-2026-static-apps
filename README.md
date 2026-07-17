# DotDev 2026: Building Without a Backend — The Static App Architecture

This repository contains the starter project and workshop material for the DotDev 2026 session on building Shopify app experiences with a static-app architecture.

The workshop is designed for developers who want to ship focused Shopify experiences without operating a custom backend for every interaction.

## What you will build

This codebase is pre-seeded with a "Spend X, get Y free" discount app that:

1. Shows a checkout banner offering a free product.
2. Discounts the product using a discount function.
3. Uses a hard-coded product to power the checkout UI extension and discount function.

You will evolve the app so that the product on offer and minimum cart price can be configured in the admin. You will:

1. Create an app home UI extension to configure discounts and Metaobjects.
2. Update the checkout banner to read from Metaobjects.
3. Update the discount function to read a reference to the offer Metaobject from the discount, and materialize its config at runtime.

This will showcase the static app architecture.

If we get time we will also add a Sidekick App data extension so merchants can interact with your app via Sidekick. This will demonstrate why it's important to decouple your app's business logic from the app home UI extension.

## Who this is for

This workshop is for app developers, agencies, and technical partners who want a practical introduction to a simpler Shopify app architecture.

You should be comfortable with:

- JavaScript or TypeScript.
- Running commands in a terminal.
- Using GitHub to clone and edit a project.
- Basic Shopify app concepts.

## Prerequisites

Expect to need:

- A GitHub account.
- Node.js and a package manager such as npm, pnpm, or yarn.
- A Shopify development store.
- Access to the Shopify CLI.
- The [Shopify AI Toolkit installed](https://shopify.dev/docs/apps/build/ai-toolkit).
- The Shopify Function Rust toolchain installed (`shopify app build` passes in this repo).

## Getting started

Use the Shopify CLI to start a new app using the start branch in this repo:

```bash
shopify app init --template=https://github.com/Shopify/dotdev-2026-static-apps#start
```

Note: `#start` on the end of this command will create the app using the start branch. Don't miss this. You need to use the start branch in the workshop.

Change directory into the directory that was just created, then run:

```bash
pnpm shopify app dev --use-localhost
```

Press P in the CLI window to open a preview link. Install the app.

## Workshop

### Step 1

Review the architecture:

![Architecture diagram](/docs/architecture.png)

Important points:

- App Home and Sidekick can both access read/write data via a shared models layer
- Offer data is persisted in the offer Metaobject as the single source of truth; the Discount stores only a reference to it
- Storing data in Metaobjects allows the checkout banner to access the offers

### Step 2

Create the data layer.  

You can use [prompt 1](./docs/prompts/1-custom-data.md) if you wish

Important points:

- Make sure merchants can read and write the metaobjects
- Make sure the storefront API can read the metaobjects

Your custom data should look like this:

```toml
[access_scopes]
scopes = "write_discounts,write_metaobject_definitions,write_metaobjects,read_products"

# Metaobject
[metaobjects.app.offer]
name = "Offer"
display_name_field = "title"
access.admin = "merchant_read_write"
access.storefront = "public_read"

[metaobjects.app.offer.fields.title]
name = "Title"
type = "single_line_text_field"
required = true

[metaobjects.app.offer.fields.minimum_cart_value]
name = "Minimum Cart Value"
type = "number_decimal"

[metaobjects.app.offer.fields.variant]
name = "Variant"
type = "variant_reference"

# Metafields
# value shape: { "id": "gid://shopify/Metaobject/…" }
[discount.metafields.app.offer_input]
name = "Offer input"
type = "json"
access.admin = "merchant_read_write"
```

### Step 3

Flesh out the functions in [shared/models/offer.js](./shared/models/offer.js).

You can use [prompt 2](./docs/prompts/2-offer-model.md) to speed run this.

Important points:

- The discount stores a reference to the offer metaobject as a JSON metafield. The function uses this to query the metaobject at runtime.
- Use the Shopify AI Toolkit to speed this up.
- Business logic is abstracted into a shared folder so Sidekick can also access it.

### Step 4

Let's add some UX polish to App Home using shopify API's:

- In `HomePage.jsx` add `shopify.loading` true/false when fetching offers.
- In `OfferPage.jsx` add `shopify.loading` true/false when fetching the offer.
- In `OfferPage.jsx` add `shopify.toast` show/hide after creating or editing an offer.

### Step 5

Now that we have a data layer you can make the [Checkout UI extension](./extensions/checkout-banner/) dynamically read from the Offer Metaobjects

You can use [prompt 3](./docs/prompts/3-checkout-banner.md).

The UI Extension should:

1. Read the Metaobject offers.
2. Show a CTA for each offer where the minimum cart value has been reached.

### Step 6

The discount function reads the offer id from the discount metafield and materializes the offer Metaobject to get the gift variant and minimum cart value.

You can use [prompt 4](./docs/prompts/4-offer-discount.md)

Note: If your function stops running, you can try uninstalling & reinstalling the app

### Step 7 (Bonus)

We previously made a `shared/models/offer.js` file.  It's time for Sidekick to consume this.

First create a data extension

```bash
shopify app generate extension --template app_data
```

Update the extension so Sidekick can tell the users what offers have been created

Important points:

- Make sure to reuse the functionality in [shared/models/offer.js](./shared/models/offer.js).
- Make sure to add `sidekick.extensions_summary` to [shopify.app.toml](./shopify.app.toml).
- [Docs can be found here](https://shopify.dev/docs/apps/build/sidekick/build-app-data).

## The complete app

The [end branch](https://github.com/Shopify/dotdev-2026-static-apps/tree/end) has the complete app.

-----

## Running the main branch

Do not use the main branch in the workshop. It's for the instructor to demo. If you do use the main branch, you'll need this command:

```bash
pnpm shopify app execute \
  --version 2026-04 \
  --query-file create-discount.graphql
```

This creates an active automatic discount that invokes the `offer-discount` Function. Run it only once per store; each execution creates another discount.
