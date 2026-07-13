import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/index.js' {
  interface ListOffersInput {
    [k: string]: unknown;
  }

  interface ListOffersOutput {
    offers?: {
      /**
       * Unique identifier for the offer
       */
      id: string;
      /**
       * Merchant-facing name of the offer
       */
      title: string;
      /**
       * Title of the product given away for free
       */
      giftProductTitle?: string;
      /**
       * Title of the specific gift variant, if any
       */
      giftVariantTitle?: string;
      /**
       * Minimum cart subtotal required to unlock the free gift
       */
      minimumSubtotal?: string;
      [k: string]: unknown;
    }[];
    [k: string]: unknown;
  }

  interface ShopifyTools {
    /**
     * List the merchant's current "Spend X, Get Y Free" offers. Each offer gives away a gift product once the cart subtotal reaches a minimum value.
     */
    register(
      name: 'list_offers',
      handler: (
        input: ListOffersInput
      ) => ListOffersOutput | Promise<ListOffersOutput>
    );
  }

  const shopify: import('@shopify/ui-extensions/admin.app.tools.data').Api & {
    tools: ShopifyTools;
  };
  const globalThis: { shopify: typeof shopify };
}
