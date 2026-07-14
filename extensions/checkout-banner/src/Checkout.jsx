import "@shopify/ui-extensions/preact";
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";

const MINIMUM_CART_VALUE = 200;
const GIFT_PRODUCT_ID = "gid://shopify/Product/8177147543605";

const GIFT_PRODUCT_QUERY = `
  query GiftProduct($id: ID!) {
    product(id: $id) {
      id
      title
      featuredImage {
        url
        altText
      }
      variants(first: 1) {
        nodes {
          id
          availableForSale
        }
      }
    }
  }
`;

async function fetchGiftProduct() {
  const {data, errors} = await shopify.query(GIFT_PRODUCT_QUERY, {
    variables: {id: GIFT_PRODUCT_ID},
  });

  if (errors?.length || !data?.product) {
    console.warn("[checkout-banner] Gift product query failed", errors);
    return null;
  }

  const variant = data.product.variants.nodes[0];
  if (!variant) return null;

  return {
    id: data.product.id,
    title: data.product.title,
    imageUrl: data.product.featuredImage?.url ?? null,
    imageAlt: data.product.featuredImage?.altText ?? data.product.title,
    variantId: variant.id,
    availableForSale: variant.availableForSale,
  };
}

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [giftProduct, setGiftProduct] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchGiftProduct().then(setGiftProduct);
  }, []);

  const subtotal = Number(shopify.cost.subtotalAmount.value?.amount ?? 0);
  const productAlreadyInCart = shopify.lines.value.some(
    (line) => line.merchandise.product?.id === GIFT_PRODUCT_ID,
  );

  if (
    !giftProduct?.availableForSale ||
    subtotal <= MINIMUM_CART_VALUE ||
    productAlreadyInCart
  ) {
    return null;
  }

  async function addGiftProduct() {
    setAdding(true);

    const result = await shopify.applyCartLinesChange({
      type: "addCartLine",
      merchandiseId: giftProduct.variantId,
      quantity: 1,
    });

    if (result.type === "error") {
      console.error("[checkout-banner] Could not add gift product", result.message);
    }

    setAdding(false);
  }

  return (
    <s-banner heading={shopify.i18n.translate("heading")}>
      <s-grid gridTemplateColumns="auto 1fr auto" gap="base" alignItems="center">
        {giftProduct.imageUrl ? (
          <s-box inlineSize="64px" blockSize="64px" borderRadius="base" overflow="hidden">
            <s-image src={giftProduct.imageUrl} alt={giftProduct.imageAlt} />
          </s-box>
        ) : null}
        <s-text>{giftProduct.title}</s-text>
        <s-button
          variant="primary"
          loading={adding}
          disabled={!shopify.instructions.value.lines.canAddCartLine}
          onClick={addGiftProduct}
        >
          {shopify.i18n.translate("claim")}
        </s-button>
      </s-grid>
    </s-banner>
  );
}
