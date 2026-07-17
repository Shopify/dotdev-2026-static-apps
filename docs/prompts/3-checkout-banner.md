# Prompt 3

Look at shopify.app.toml to understand the custom data for this app.

extensions/checkout-banner currently shows an offer for a hardcoded product. Instead it should use the Storefront API to fetch `$app:offer` metaobjects. It should then show a single banner with each row being each offer that's currently matched.  

The user should only be able to add one offer to the cart.

Use the Shopify Dev MCP

---

This is for [step 5 in the README](../../README.md#step-5)
