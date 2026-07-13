import { useState, useEffect, useRef } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import {
  fetchOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  validateOffer,
  EMPTY_OFFER,
} from '../../../../shared/models/offer';


export default function OfferPage({ id }) {
  const isNew = id === 'new';
  const location = useLocation();

  const snapshot = useRef({ ...EMPTY_OFFER });
  const [offer, setOffer] = useState({ ...EMPTY_OFFER });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    async function loadOffer() {
      if (isNew) {
        return;
      }

      shopify.loading(true)
      setError(null);
      setFieldErrors({});

      try {
        const offer = await fetchOffer(id);
        snapshot.current = offer;
        setOffer(offer);
      } catch {
        setError('Failed to load offer');
      } finally {
        setStatus('idle');
      }

      shopify.loading(false);
    }

    loadOffer();
  }, [id, isNew]);

  const setOfferField = (key, value) => {
    setOffer((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Opens the product resource picker. 
  // If the merchant drills in and picks one variant, it comes back in the
  // product's `variants` array and is shown alongside the product.
  const pickProduct = async () => {
    const selected = await shopify.resourcePicker({
      type: 'product',
      action: 'select',
      multiple: false,
      selectionIds: offer.productId
        ? [
          {
            id: offer.productId,
            variants: offer.variantId ? [{ id: offer.variantId }] : [],
          },
        ]
        : [],
    });

    const product = selected?.[0];

    // The picker returns undefined when the merchant cancels.
    if (!product) return;

    setFieldErrors((prev) => ({ ...prev, productId: undefined }));
    setOffer((prev) => ({
      ...prev,
      productId: product.id,
      productTitle: product.title,
      imageUrl: product.images?.[0]?.originalSrc ?? null,
      imageAlt: product.title,
      variantId: product.variants?.[0]?.id ?? null,
      variantTitle: product.variants?.[0]?.title ?? '',
    }));
  };

  const saveOffer = async () => {
    const nextFieldErrors = validateOffer(offer);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      // Throw so the host knows the submit failed and keeps the contextual
      // save bar armed. Returning would clear the dirty state the same way
      // a successful save does, hiding the field errors from the merchant.
      throw new Error('Validation failed');
    }

    setStatus('saving');
    setError(null);
    setFieldErrors({});

    // createOffer/updateOffer also enable/disable the discount to match the
    // requested active state; a failure there surfaces here as a save error.
    try {
      isNew ? await createOffer(offer) : await updateOffer(id, offer);
    } catch (saveError) {
      setError(
        saveError.message || `Failed to ${isNew ? 'save' : 'update'} offer`,
      );
      setStatus('idle');
      throw saveError;
    }

    snapshot.current = offer;
    setStatus('idle');
    
    if (isNew) {
      location.route('/');
    }

    shopify.toast.show(isNew ? 'Offer created' : 'Offer updated');
  };

  const handleSave = (event) => {
    event?.waitUntil?.(saveOffer());
  };

  const handleReset = () => {
    setOffer({ ...snapshot.current });
    setFieldErrors({});
  };

  const handleDelete = async () => {
    setStatus('deleting');
    shopify.loading(true)

    try {
      await deleteOffer(id);
    } catch {
      setError('Failed to delete offer');
      setStatus('idle');
      return;
    }

    location.route('/');
    shopify.loading(false);
  };

  const isLoading = status === 'loading';
  const heading = isNew ? 'New offer' : isLoading ? '' : offer.title || 'Offer';

  return (
    <s-page heading={heading} inlineSize="small">
      <s-link slot="breadcrumb-actions" href="/">
        Offers
      </s-link>

      {!isNew && (
        <s-button
          slot="secondary-actions"
          tone="critical"
          onClick={handleDelete}
          loading={status === 'deleting'}
          disabled={status === 'saving'}
        >
          Delete
        </s-button>
      )}

      {error && <s-banner tone="critical">{error}</s-banner>}

      {!isLoading && (
        <s-section heading="Offer details">
          <s-form onSubmit={handleSave} onReset={handleReset}>
            <s-stack gap="base">
              <s-text-field
                label="Title"
                name="title"
                placeholder="e.g. Free gift over $50"
                value={offer.title}
                onInput={(e) => setOfferField('title', e.target.value)}
                details="Buyers don't see this, it's for your reference only."
                required
                error={fieldErrors.title}
              />

              <s-money-field
                label="Minimum cart price"
                name="minimumSubtotal"
                labelAccessibilityVisibility="visible"
                placeholder="0.00"
                value={offer.minimumSubtotal}
                onInput={(e) =>
                  setOfferField('minimumSubtotal', e.target.value)
                }
                details="The product is given away free once the cart subtotal reaches this amount"
                required
                min={0}
                error={fieldErrors.minimumSubtotal}
              />

              {!offer.productId && (
                <s-stack gap="small-200">
                  <s-text>Discounted product</s-text>
                  <s-box padding="base" borderWidth="base" borderRadius="base">
                    <s-grid
                      gridTemplateColumns="auto 1fr auto"
                      gap="base"
                      alignItems="center"
                    >
                      <s-button type="button" onClick={() => pickProduct()}>
                        Select product
                      </s-button>
                    </s-grid>
                  </s-box>
                </s-stack>
              )}

              {offer.productId && (
                <s-stack gap="small-200">
                  <s-box padding="base" borderWidth="base" borderRadius="base">
                    <s-grid
                      gridTemplateColumns="auto 1fr auto"
                      gap="base"
                      alignItems="center"
                    >
                      <s-box
                        maxInlineSize="48px"
                        maxBlockSize="48px"
                        borderRadius="base"
                        overflow="hidden"
                      >
                        {offer.imageUrl ? (
                          <s-image
                            src={offer.imageUrl}
                            alt={offer.imageAlt ?? offer.productTitle}
                          />
                        ) : (
                          <s-box
                            inlineSize="48px"
                            blockSize="48px"
                            background="subdued"
                          />
                        )}
                      </s-box>
                      <s-text>
                        {offer.variantTitle
                          ? `${offer.productTitle}: ${offer.variantTitle}`
                          : offer.productTitle}
                      </s-text>
                      <s-button type="button" onClick={() => pickProduct()}>
                        Change
                      </s-button>
                    </s-grid>
                  </s-box>
                </s-stack>
              )}

            </s-stack>
          </s-form>
        </s-section>
      )}
    </s-page>
  );
}
