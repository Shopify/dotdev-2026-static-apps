import { fetchOffers } from '../../../shared/models/offer';

export default async function extension() {
  shopify.tools.register('list_offers', async () => {
    const offers = await fetchOffers();

    return {
      offers: offers.map((offer) => ({
        id: offer.id,
        title: offer.title,
        giftProductTitle: offer.productTitle,
        giftVariantTitle: offer.variantTitle,
        minimumSubtotal: offer.minimumSubtotal,
      })),
    };
  });
}
