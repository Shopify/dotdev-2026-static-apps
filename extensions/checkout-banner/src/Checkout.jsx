import "@shopify/ui-extensions/preact";
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";

// Offers live as app-owned `$app:offer` metaobjects (see shopify.app.toml) that
// are readable through the Storefront API. The gift product/image come from the
// metaobject's variant reference; the metaobject itself only stores title,
// minimum cart value, and variant.
const OFFERS_QUERY = `
  query OfferMetaobjects {
    metaobjects(type: "$app:offer", first: 100) {
      nodes {
        id
        title: field(key: "title") { value }
        minimumCartValue: field(key: "minimum_cart_value") { value }
        variant: field(key: "variant") {
          reference {
            ... on ProductVariant {
              id
              title
              availableForSale
              image { url altText }
              product { title }
            }
          }
        }
      }
    }
  }
`;

async function fetchOffers() {
  const {data, errors} = await shopify.query(OFFERS_QUERY);

  if (errors?.length || !data?.metaobjects) {
    console.warn("[checkout-banner] Offer metaobjects query failed", errors);
    return [];
  }

  // Drop offers whose variant reference is missing; there is no gift to claim.
  return data.metaobjects.nodes
    .map((node) => {
      const variant = node.variant?.reference;
      if (!variant) return null;

      return {
        id: node.id,
        title: node.title?.value ?? variant.product?.title ?? variant.title,
        minimumCartValue: Number(node.minimumCartValue?.value ?? 0),
        variantId: variant.id,
        imageUrl: variant.image?.url ?? null,
        imageAlt: variant.image?.altText ?? variant.title,
        availableForSale: variant.availableForSale,
      };
    })
    .filter(Boolean);
}

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [offers, setOffers] = useState([]);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    fetchOffers().then(setOffers);
  }, []);

  const subtotal = Number(shopify.cost.subtotalAmount.value?.amount ?? 0);
  const lines = shopify.lines.value;

  // A gift is claimed once its variant is a cart line. The buyer may only claim
  // one offer, so as soon as any gift is in the cart every other claim locks.
  const claimed = (variantId) =>
    lines.some((line) => line.merchandise.id === variantId);
  const hasClaimedGift = offers.some((offer) => claimed(offer.variantId));

  // Show every offer whose minimum is met and whose gift is still available.
  // The Function qualifies a cart when its value is strictly above the minimum.
  const matchedOffers = offers.filter(
    (offer) => offer.availableForSale && subtotal > offer.minimumCartValue,
  );

  if (matchedOffers.length === 0) {
    return null;
  }

  async function addGift(offer) {
    setAddingId(offer.id);

    const result = await shopify.applyCartLinesChange({
      type: "addCartLine",
      merchandiseId: offer.variantId,
      quantity: 1,
    });

    if (result.type === "error") {
      console.error("[checkout-banner] Could not add gift product", result.message);
    }

    setAddingId(null);
  }

  return (
    <s-banner heading={shopify.i18n.translate("heading")}>
      <s-stack direction="block" gap="base">
        {matchedOffers.map((offer) => {
          const isClaimed = claimed(offer.variantId);
          return (
            <s-grid
              key={offer.id}
              gridTemplateColumns="auto 1fr auto"
              gap="base"
              alignItems="center"
            >
              {offer.imageUrl ? (
                <s-box inlineSize="64px" blockSize="64px" borderRadius="base" overflow="hidden">
                  <s-image src={offer.imageUrl} alt={offer.imageAlt} />
                </s-box>
              ) : null}
              <s-text>{offer.title}</s-text>
              {isClaimed ? (
                <s-badge tone="neutral">{shopify.i18n.translate("claimed")}</s-badge>
              ) : (
                <s-button
                  variant="primary"
                  loading={addingId === offer.id}
                  disabled={
                    hasClaimedGift ||
                    addingId !== null ||
                    !shopify.instructions.value.lines.canAddCartLine
                  }
                  onClick={() => addGift(offer)}
                >
                  {shopify.i18n.translate("claim")}
                </s-button>
              )}
            </s-grid>
          );
        })}
      </s-stack>
    </s-banner>
  );
}
