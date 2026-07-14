# DotDev 2026: Building Without a Backend — The Static App Architecture

This repository contains the starter project and workshop material for the DotDev 2026 session on building Shopify app experiences with a static-app architecture.

The workshop is designed for developers who want to ship focused Shopify experiences without operating a custom backend for every interaction.

## What you will build

This codebase is pre-seeded with a "Spend X, get Y free" discount app that:

1. Shows a checkout banner offering a free product.
2. Discounts the product using a discount function.
3. Uses a hard-coded product to power the checkout UI extension and discount function.

You will evolve the app so that the product on offer and minimum cart price can be configured in the admin. You will:

1. Create an app home UI Extension to configure discounts and Metaobjects.
2. Update the checkout banner to read from Metaobjects.
3. Update the discount function to get the Metaobject using a Metafield on the discount.

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

The README for the app you created in the "getting started" section will include the workshop steps.

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
