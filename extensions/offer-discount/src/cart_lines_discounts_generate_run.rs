use super::schema;
use shopify_function::prelude::*;
use shopify_function::Result;

use schema::cart_lines_discounts_generate_run::input::cart::lines::Merchandise;

const MINIMUM_CART_VALUE: f64 = 200.0;
const GIFT_PRODUCT_ID: &str = "gid://shopify/Product/8177147543605";

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

    // Do not let the gift's own price count toward the qualifying spend.
    let qualifying_cart_value: f64 = input
        .cart()
        .lines()
        .iter()
        .filter_map(|line| match line.merchandise() {
            Merchandise::ProductVariant(variant)
                if variant.product().id().as_str() != GIFT_PRODUCT_ID =>
            {
                Some(line.cost().subtotal_amount().amount().as_f64())
            }
            _ => None,
        })
        .sum();

    if qualifying_cart_value <= MINIMUM_CART_VALUE {
        return Ok(no_discounts());
    }

    let candidates: Vec<_> = input
        .cart()
        .lines()
        .iter()
        .filter_map(|line| {
            let variant = match line.merchandise() {
                Merchandise::ProductVariant(variant) => variant,
                _ => return None,
            };

            if variant.product().id().as_str() != GIFT_PRODUCT_ID {
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
        })
        .collect();

    if candidates.is_empty() {
        return Ok(no_discounts());
    }

    Ok(schema::CartLinesDiscountsGenerateRunResult {
        operations: vec![schema::CartOperation::ProductDiscountsAdd(
            schema::ProductDiscountsAddOperation {
                selection_strategy: schema::ProductDiscountSelectionStrategy::All,
                candidates,
            },
        )],
    })
}
