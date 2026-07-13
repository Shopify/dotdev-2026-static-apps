## When to Use This App's Tools

Use these tools when the merchant asks about:

- Their "Spend X, Get Y Free" offers
- Which free gifts are currently on offer
- The minimum cart value needed to unlock a gift

## Important Guidelines

- Use `list_offers` to retrieve every current offer. It takes no parameters.
- Each offer includes its title, the gift product (and variant, if set), and the
  minimum cart subtotal required to unlock the gift.

## Common Workflows

### Listing offers

1. Call `list_offers` to get all current offers.
2. Present each offer with its title, gift product, and minimum subtotal.
