# Prompt 4

Look at shopify.app.toml to understand the custom data for this app

The current discount function in `extensions/offer-discount/` uses a hard coded product ID and minimum cart value. Instead it should read the offer id from the discount's `offer_input` JSON metafield, bound as an input query variable, and query the offer metaobject to get the variant and minimum cart value. You should bind `offer_input` with `[extensions.input.variables]`. Name the query variable after its top-level key (`$id`).

Let's also configure `extensions.ui.paths.create` and `extensions.ui.paths.details`. Look at the routes in `extensions/app-home/` for context.

Use the Shopify Dev MCP

---

This is for [step 6 in the README](../../README.md#step-6)
