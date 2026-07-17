import { gidToId, idToGid } from "../utils/gid";

function gqlFetch(query, variables) {
  return fetch("shopify:admin/api/2026-04/graphql.json", {
    method: "POST",
    body: JSON.stringify({ query, variables }),
  }).then((r) => r.json());
}

export const EMPTY_OFFER = {
  id: "123",
  title: "",
  productId: "",
  productTitle: "",
  imageUrl: null,
  imageAlt: null,
  variantId: null,
  variantTitle: "",
  minimumSubtotal: "0.00",
};

export async function createOffer(offer) {
  return EMPTY_OFFER;
}

export async function updateOffer(id, offer) {
  return offer;
}

export async function deleteOffer(id) {
  return true
}

export async function fetchOffer(id) {
  return EMPTY_OFFER;
}

export async function fetchOffers(first = 10) {
  return [];
}

export async function validateOffer(offer) {
  return {};
}
