use super::schema;
use shopify_function::prelude::*;
use shopify_function::Result;

use schema::cart_lines_discounts_generate_run::input::cart::lines::Merchandise;

#[shopify_function]
fn cart_lines_discounts_generate_run(
    input: schema::cart_lines_discounts_generate_run::Input,
) -> Result<schema::CartLinesDiscountsGenerateRunResult> {
    let no_discounts = || schema::CartLinesDiscountsGenerateRunResult { operations: vec![] };

    if !input
        .discount()
        .discount_classes()
        .contains(&schema::DiscountClass::Product)
    {
        return Ok(no_discounts());
    }

    // The gift variant and qualifying threshold live on the offer metaobject,
    // materialized from the id in the discount's $app.offer_input metafield.
    let offer = match input.shop().offer() {
        Some(offer) => offer,
        None => return Ok(no_discounts()),
    };

    let gift_variant_id = match offer.variant().and_then(|field| field.value()) {
        Some(value) => value,
        None => return Ok(no_discounts()),
    };

    let minimum_cart_value: f64 = match offer
        .minimum_cart_value()
        .and_then(|field| field.value())
    {
        Some(value) => value.parse().unwrap_or(0.0),
        None => return Ok(no_discounts()),
    };

    // Do not let the gift's own price count toward the qualifying spend.
    let qualifying_cart_value: f64 = input
        .cart()
        .lines()
        .iter()
        .filter_map(|line| match line.merchandise() {
            Merchandise::ProductVariant(variant) if variant.id().as_str() != gift_variant_id.as_str() => {
                Some(line.cost().subtotal_amount().amount().as_f64())
            }
            _ => None,
        })
        .sum();

    if qualifying_cart_value <= minimum_cart_value {
        return Ok(no_discounts());
    }

    // Discount a single gift, even if multiple offer products are in the cart.
    let candidate = input.cart().lines().iter().find_map(|line| {
        let variant = match line.merchandise() {
            Merchandise::ProductVariant(variant) => variant,
            _ => return None,
        };

        if variant.id().as_str() != gift_variant_id.as_str() {
            return None;
        }

        Some(schema::ProductDiscountCandidate {
            targets: vec![schema::ProductDiscountCandidateTarget::CartLine(
                schema::CartLineTarget {
                    id: line.id().clone(),
                    quantity: Some(1),
                },
            )],
            message: Some("Offer applied: this product is free!".to_string()),
            value: schema::ProductDiscountCandidateValue::Percentage(schema::Percentage {
                value: Decimal(100.0),
            }),
            associated_discount_code: None,
            prerequisites: None,
        })
    });

    let Some(candidate) = candidate else {
        return Ok(no_discounts());
    };

    Ok(schema::CartLinesDiscountsGenerateRunResult {
        operations: vec![schema::CartOperation::ProductDiscountsAdd(
            schema::ProductDiscountsAddOperation {
                selection_strategy: schema::ProductDiscountSelectionStrategy::First,
                candidates: vec![candidate],
            },
        )],
    })
}
