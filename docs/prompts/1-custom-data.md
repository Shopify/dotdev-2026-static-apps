# Prompt 1

Add some custom data to shopify.app.toml

There should be an app offer metaobject.  It should have title, minimum cart value and a variant reference. Merchants and storefront can access this.

On discounts, create a single `offer_input` metafield of type `json`. It holds the metaobject id in JSON as `{ "id": "<offer metaobject gid>" }`. Document this shape as a comment on the metafield definition. The discount function will read this to look up the offer's variant and minimum cart value at runtime.

Add `write_metaobject_definitions` and `write_metaobjects` to the scopes.

Use the Shopify Dev MCP

-----

This is for [Step 2 in the README](../../README.md#step-2)
