# Prompt 2
 
In models/offer.js populate the 6 empty functions. They should all speak the offer shaped defined by EMPTY_OFFER and use gqlFetch to use Direct API to fetch data from the Admin API.  Creating/updating/deleting should create/edit/delete both the discount and the Metaobject.  The discount only stores a reference to the offer metaobject in as JSON as `{ "id": "<offer metaobject gid>" }`.  Offer discounts should be active when created.  

To gain context look at the custom data we have defined in shopify.app.toml.  Note the metaobject is not publishable.

Use the Shopify Dev MCP

---

This is for [step 3 in the README](../../README.md#step-3)
