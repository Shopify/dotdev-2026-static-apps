import { gidToId, idToGid } from "../utils/gid";

function gqlFetch(query, variables) {
  return fetch("shopify:admin/api/2026-04/graphql.json", {
    method: "POST",
    body: JSON.stringify({ query, variables }),
  }).then((r) => r.json());
}

// Run a GraphQL operation and surface top-level errors as exceptions so the
// callers in OfferPage can show a save/load banner.
async function request(query, variables) {
  const { data, errors } = await gqlFetch(query, variables);
  if (errors?.length) {
    throw new Error(errors[0].message);
  }
  return data;
}

// Mutations report business-rule failures through `userErrors`, not `errors`.
function throwOnUserErrors(userErrors) {
  if (userErrors?.length) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }
}

export const EMPTY_OFFER = {
  title: "",
  productId: "",
  productTitle: "",
  imageUrl: null,
  imageAlt: null,
  variantId: null,
  variantTitle: "",
  minimumSubtotal: "0.00",
  active: false,
};

// The gift product/image are derived from the Metaobject's variant reference;
// the Metaobject itself only stores title, minimum cart value, and variant.
const OFFER_FRAGMENT = `
  id
  title: field(key: "title") { value }
  minimumCartValue: field(key: "minimum_cart_value") { value }
  variant: field(key: "variant") {
    reference {
      ... on ProductVariant {
        id
        title
        product {
          id
          title
          featuredMedia { preview { image { url altText } } }
        }
      }
    }
  }
`;

const OFFER_LIST = `
  query OfferList {
    metaobjects(type: "$app:offer", first: 100) {
      nodes { ${OFFER_FRAGMENT} }
    }
  }
`;

const OFFER_BY_ID = `
  query OfferById($id: ID!) {
    metaobject(id: $id) { ${OFFER_FRAGMENT} }
  }
`;

const CREATE_METAOBJECT = `
  mutation CreateOfferObject($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message code }
    }
  }
`;

const UPDATE_METAOBJECT = `
  mutation UpdateOfferObject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message code }
    }
  }
`;

const DELETE_METAOBJECT = `
  mutation DeleteOfferObject($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors { field message code }
    }
  }
`;

const CREATE_DISCOUNT = `
  mutation CreateOfferDiscount($discount: DiscountAutomaticAppInput!) {
    discountAutomaticAppCreate(automaticAppDiscount: $discount) {
      automaticAppDiscount { discountId }
      userErrors { field message }
    }
  }
`;

const UPDATE_DISCOUNT = `
  mutation UpdateOfferDiscount($id: ID!, $discount: DiscountAutomaticAppInput!) {
    discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $discount) {
      automaticAppDiscount { discountId }
      userErrors { field message }
    }
  }
`;

const DELETE_DISCOUNT = `
  mutation DeleteOfferDiscount($id: ID!) {
    discountAutomaticDelete(id: $id) {
      deletedAutomaticDiscountId
      userErrors { field message }
    }
  }
`;

// No reverse reference is stored on the Metaobject, so the discount is located
// by the `$app.offer_input` metafield that holds the offer id.
const FIND_DISCOUNT = `
  query FindOfferDiscount($first: Int!) {
    discountNodes(first: $first) {
      nodes {
        id
        offerInput: metafield(namespace: "$app", key: "offer_input") { value }
      }
    }
  }
`;

// Map a Metaobject node from the queries above onto the EMPTY_OFFER shape.
function offerFromMetaobject(node) {
  const variant = node.variant?.reference ?? null;
  const product = variant?.product ?? null;
  const image = product?.featuredMedia?.preview?.image ?? null;

  return {
    id: gidToId(node.id),
    title: node.title?.value ?? "",
    productId: product?.id ?? "",
    productTitle: product?.title ?? "",
    imageUrl: image?.url ?? null,
    imageAlt: image?.altText ?? null,
    variantId: variant?.id ?? null,
    variantTitle: variant?.title ?? "",
    minimumSubtotal: node.minimumCartValue?.value ?? "0.00",
    // Offers are always active; there is no active/inactive toggle.
    active: true,
  };
}

// Metaobject fields, keyed to the $app:offer definition in shopify.app.toml.
function offerFields(offer) {
  return [
    { key: "title", value: offer.title },
    { key: "minimum_cart_value", value: offer.minimumSubtotal },
    { key: "variant", value: offer.variantId },
  ];
}

// Fetches at most 100 discounts; a store with more would need pagination.
async function findDiscountGid(metaobjectGid) {
  const data = await request(FIND_DISCOUNT, { first: 100 });
  const match = data.discountNodes.nodes.find(
    (node) => node.offerInput && JSON.parse(node.offerInput.value).offerId === metaobjectGid,
  );
  return match?.id ?? null;
}

export async function createOffer(offer) {
  // 1. Create the Metaobject unpublished so it isn't visible before its discount exists.
  const created = await request(CREATE_METAOBJECT, {
    metaobject: {
      type: "$app:offer",
      capabilities: { publishable: { status: "DRAFT" } },
      fields: offerFields(offer),
    },
  });
  throwOnUserErrors(created.metaobjectCreate.userErrors);
  const metaobjectGid = created.metaobjectCreate.metaobject.id;

  // 2. Create the automatic discount. It stores only the offer id (json), which
  //    the Function binds to its input query variables.
  //    combinesWith.productDiscounts lets multiple gifts apply.
  const discount = await request(CREATE_DISCOUNT, {
    discount: {
      title: offer.title,
      functionHandle: "offer-discount",
      discountClasses: ["PRODUCT"],
      startsAt: new Date().toISOString(),
      combinesWith: { productDiscounts: true },
      metafields: [
        {
          namespace: "$app",
          key: "offer_input",
          type: "json",
          value: JSON.stringify({ offerId: metaobjectGid }),
        },
      ],
    },
  });
  throwOnUserErrors(discount.discountAutomaticAppCreate.userErrors);

  // 3. Publish the Metaobject now that its discount is in place.
  const published = await request(UPDATE_METAOBJECT, {
    id: metaobjectGid,
    metaobject: { capabilities: { publishable: { status: "ACTIVE" } } },
  });
  throwOnUserErrors(published.metaobjectUpdate.userErrors);

  return { ...offer, id: gidToId(metaobjectGid), active: true };
}

export async function updateOffer(id, offer) {
  const metaobjectGid = idToGid(id);

  // Keep the Metaobject fields in sync.
  const updated = await request(UPDATE_METAOBJECT, {
    id: metaobjectGid,
    metaobject: { fields: offerFields(offer) },
  });
  throwOnUserErrors(updated.metaobjectUpdate.userErrors);

  // Keep the discount's title in sync. Its metafields only reference the
  // Metaobject by id, which never changes, so they don't need re-writing.
  const discountGid = await findDiscountGid(metaobjectGid);
  if (discountGid) {
    const discount = await request(UPDATE_DISCOUNT, {
      id: discountGid,
      discount: { title: offer.title },
    });
    throwOnUserErrors(discount.discountAutomaticAppUpdate.userErrors);
  }

  return { ...offer, id, active: true };
}

export async function deleteOffer(id) {
  const metaobjectGid = idToGid(id);

  // Unpublish first so the storefront and Function stop seeing the offer.
  const unpublished = await request(UPDATE_METAOBJECT, {
    id: metaobjectGid,
    metaobject: { capabilities: { publishable: { status: "DRAFT" } } },
  });
  throwOnUserErrors(unpublished.metaobjectUpdate.userErrors);

  // Delete the discount before the Metaobject it points at.
  const discountGid = await findDiscountGid(metaobjectGid);
  if (discountGid) {
    const discount = await request(DELETE_DISCOUNT, { id: discountGid });
    throwOnUserErrors(discount.discountAutomaticDelete.userErrors);
  }

  const deleted = await request(DELETE_METAOBJECT, { id: metaobjectGid });
  throwOnUserErrors(deleted.metaobjectDelete.userErrors);

  return true;
}

export async function fetchOffer(id) {
  const data = await request(OFFER_BY_ID, { id: idToGid(id) });
  if (!data.metaobject) {
    throw new Error("Offer not found");
  }
  return offerFromMetaobject(data.metaobject);
}

export async function fetchOffers() {
  const data = await request(OFFER_LIST);
  return data.metaobjects.nodes.map(offerFromMetaobject);
}

export function validateOffer(offer) {
  const errors = {};

  if (!offer.title.trim()) {
    errors.title = "Title is required";
  }

  if (!offer.productId) {
    errors.productId = "Select a product to give away";
  }

  const minimum = Number(offer.minimumSubtotal);
  if (!offer.minimumSubtotal || Number.isNaN(minimum) || minimum <= 0) {
    errors.minimumSubtotal = "Enter a minimum cart price greater than 0";
  }

  return errors;
}
