import { useState, useEffect } from 'preact/hooks';
import { fetchOffers } from '../../../../shared/models/offer';

export default function HomePage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers().then(setOffers).finally(() => setLoading(false));
  }, []);

  return (
    <s-page heading="Offers">
      <s-button slot="primary-action" variant="primary" href="/offer/new">
        Create Offer
      </s-button>
      
      {!loading && !offers.length && (
        <s-section accessibilityLabel="Empty state section">
          <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
            <s-box maxInlineSize="200px" maxBlockSize="200px">
              <s-image
                aspectRatio="1/0.5"
                src={'https://cdn.shopify.com/static/images/polaris/patterns/callout.png'}
                alt="Illustration of offer creation"
              />
            </s-box>
            <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
              <s-stack alignItems="center">
                <s-heading>Start creating offers</s-heading>
                <s-paragraph>
                  Give a product away when customers spend enough.
                </s-paragraph>
              </s-stack>
              <s-button-group>
                <s-button
                  slot="primary-action"
                  accessibilityLabel="Add a new offer"
                  href="/offer/new"
                >
                  Create offer
                </s-button>
              </s-button-group>
            </s-grid>
          </s-grid>
        </s-section>
      )}

      {!loading && offers.length ? (
        <s-section padding="none" accessibilityLabel="Offers table section">
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Name</s-table-header>
              <s-table-header>Product</s-table-header>
              <s-table-header>Minimum cart price</s-table-header>
              <s-table-header>Status</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {offers.map((offer) => (
                <s-table-row key={offer.id}>
                  <s-table-cell>
                    <s-link href={`/offer/${offer.id}`}>
                      {offer.title || 'Untitled'}
                    </s-link>
                  </s-table-cell>
                  <s-table-cell>{offer.productTitle || '—'}</s-table-cell>
                  <s-table-cell>{offer.minimumSubtotal}</s-table-cell>
                  <s-table-cell>
                    {offer.active ? (
                      <s-badge tone="success">Active</s-badge>
                    ) : (
                      <s-badge>Inactive</s-badge>
                    )}
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        </s-section>
      ) : null}
    </s-page>
  );
}
